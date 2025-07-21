-- Update the owner email to lowercase to match the signup attempt
UPDATE admin_users 
SET email = 'grant@clearhomeloans.com' 
WHERE email = 'grant@ClearHomeLoans.com';