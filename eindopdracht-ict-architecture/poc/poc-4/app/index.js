const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'budgetdb',
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resetBudget() {
  await pool.query(
    'UPDATE budget SET uitgegeven_budget = 0 WHERE id = 1'
  );
}

async function getBudget() {
  const result = await pool.query(
    'SELECT uitgegeven_budget FROM budget WHERE id = 1'
  );
  return parseFloat(result.rows[0].uitgegeven_budget);
}

// Without FOR UPDATE: demonstrates the lost update problem.
// Both transactions read the same value before either commits,
// so one update overwrites the other.
async function updateWithoutLock(name, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT uitgegeven_budget FROM budget WHERE id = 1'
    );
    const current = parseFloat(result.rows[0].uitgegeven_budget);
    console.log(`[${name}] Read: ${current}`);

    // Simulate processing time so both transactions overlap
    await sleep(100);

    const newValue = current + amount;
    await client.query(
      'UPDATE budget SET uitgegeven_budget = $1 WHERE id = 1',
      [newValue]
    );
    console.log(`[${name}] Write: ${newValue}`);
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

// With FOR UPDATE: row is locked after the SELECT,
// so the second transaction waits until the first commits.
async function updateWithLock(name, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT uitgegeven_budget FROM budget WHERE id = 1 FOR UPDATE'
    );
    const current = parseFloat(result.rows[0].uitgegeven_budget);
    console.log(`[${name}] Read (locked): ${current}`);

    await sleep(100);

    const newValue = current + amount;
    await client.query(
      'UPDATE budget SET uitgegeven_budget = $1 WHERE id = 1',
      [newValue]
    );
    console.log(`[${name}] Write: ${newValue}`);
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

async function run() {
  // Wait for the database to be ready
  await sleep(2000);

  console.log('=== Scenario 1: without FOR UPDATE (lost update) ===');
  await resetBudget();
  console.log(`Starting value: ${await getBudget()}`);

  // Both updates run concurrently without locking
  await Promise.all([
    updateWithoutLock('User A', 100),
    updateWithoutLock('User B', 50),
  ]);

  const afterUnlocked = await getBudget();
  console.log(`Result: ${afterUnlocked}`);
  console.log(`Expected: 150 -- Correct: ${afterUnlocked === 150}`);

  console.log('');
  console.log('=== Scenario 2: with FOR UPDATE (correct) ===');
  await resetBudget();
  console.log(`Starting value: ${await getBudget()}`);

  // Both updates run concurrently with row-level locking
  await Promise.all([
    updateWithLock('User A', 100),
    updateWithLock('User B', 50),
  ]);

  const afterLocked = await getBudget();
  console.log(`Result: ${afterLocked}`);
  console.log(`Expected: 150 -- Correct: ${afterLocked === 150}`);

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
