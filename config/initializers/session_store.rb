# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_progress_session',
  :secret      => '835e77ed6203485fa6a6485a08c9e773bd5f52a3de946fac58342bf1670f615c4bc99a4d7cf1a74b15e1241fa9d7edfcc645f1c4f73dd1129724a5f31d20b8be'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
