-- ============================================================
-- Seed data — topics and sample companies
-- Run AFTER schema.sql
-- ============================================================

-- Topics
insert into public.topics (name, slug, description, color) values
  ('Probability', 'probability', 'Classic probability problems, conditional probability, Bayes theorem', '#6366f1'),
  ('Statistics', 'statistics', 'Distributions, hypothesis testing, regression, estimation', '#3b82f6'),
  ('Brainteasers', 'brainteasers', 'Logic puzzles and lateral thinking questions', '#8b5cf6'),
  ('Options Pricing', 'options-pricing', 'Black-Scholes, greeks, volatility, derivatives valuation', '#22c55e'),
  ('Stochastic Processes', 'stochastic-processes', 'Brownian motion, Ito calculus, martingales, SDEs', '#f59e0b'),
  ('Mental Math', 'mental-math', 'Fast arithmetic, estimation, back-of-the-envelope calculations', '#f97316'),
  ('Linear Algebra', 'linear-algebra', 'Matrix operations, eigenvalues, PCA, linear systems', '#ec4899'),
  ('Game Theory', 'game-theory', 'Nash equilibria, auction theory, strategic reasoning', '#06b6d4'),
  ('Combinatorics', 'combinatorics', 'Counting, permutations, combinations, pigeonhole principle', '#84cc16'),
  ('Market Making', 'market-making', 'Bid-ask spreads, inventory management, adverse selection', '#14b8a6'),
  ('Programming', 'programming', 'Python, algorithms, data structures for quant roles', '#f43f5e'),
  ('Risk Management', 'risk-management', 'VaR, Greeks, portfolio risk, stress testing', '#a78bfa'),
  ('Calculus', 'calculus', 'Differentiation, integration, optimization, Taylor series', '#fb923c'),
  ('Finance Fundamentals', 'finance-fundamentals', 'Time value of money, bonds, equity, fixed income basics', '#34d399')
on conflict (slug) do nothing;

-- Companies
insert into public.companies (name, slug, description, is_premium) values
  ('Jane Street', 'jane-street', 'Quantitative trading firm known for rigorous math-heavy interviews', true),
  ('Citadel', 'citadel', 'Global hedge fund with quantitative and systematic strategies', true),
  ('Two Sigma', 'two-sigma', 'Data-driven hedge fund emphasizing statistics and ML', true),
  ('DE Shaw', 'de-shaw', 'Quantitative investment firm with diverse strategies', true),
  ('Jump Trading', 'jump-trading', 'Proprietary trading firm focused on algorithmic trading', true),
  ('Optiver', 'optiver', 'Market maker with a focus on options and ETFs', true),
  ('IMC Trading', 'imc-trading', 'Market maker and prop trader across global exchanges', true),
  ('Susquehanna (SIG)', 'sig', 'Global quantitative trading firm and market maker', true),
  ('Akuna Capital', 'akuna-capital', 'Options market maker with strong quant culture', true),
  ('HRT (Hudson River Trading)', 'hrt', 'High-frequency trading and quantitative research firm', true),
  ('DRW', 'drw', 'Principal trading firm active in multiple asset classes', true),
  ('Virtu Financial', 'virtu', 'Market maker and high-frequency trading firm', true)
on conflict (slug) do nothing;
