CREATE TABLE budget (
    id SERIAL PRIMARY KEY,
    naam VARCHAR(100) NOT NULL,
    max_budget NUMERIC(10,2) NOT NULL,
    uitgegeven_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    valuta VARCHAR(10) NOT NULL,
    laatste_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO budget (naam, max_budget, valuta)
VALUES ('Zomervakantie Spanje', 2000.00, 'EUR');
