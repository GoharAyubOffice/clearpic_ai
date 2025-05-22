from supabase import create_client, Client
import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        try:
            # Get environment variables
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_anon_key = os.getenv("SUPABASE_KEY")
            supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
            
            # Validate environment variables
            if not supabase_url or not supabase_anon_key or not supabase_service_key:
                raise ValueError("Missing Supabase credentials. Please set SUPABASE_URL, SUPABASE_KEY, and SUPABASE_SERVICE_KEY environment variables.")
            
            logger.info(f"Initializing Supabase client with URL: {supabase_url}")
            
            # Initialize clients
            self.client: Client = create_client(supabase_url, supabase_anon_key)
            self.service_client: Client = create_client(supabase_url, supabase_service_key)
            
            # Verify connection and auth setup
            try:
                # Test auth connection
                auth_response = self.client.auth.get_session()
                logger.info("Auth connection verified successfully")
                
                # Test database connection
                db_response = self.client.table('profiles').select('id').limit(1).execute()
                logger.info("Database connection verified successfully")
                
            except Exception as conn_error:
                logger.error(f"Failed to verify Supabase connection: {str(conn_error)}")
                raise Exception(f"Failed to verify Supabase connection: {str(conn_error)}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase service: {str(e)}")
            raise

    async def sign_up(self, email: str, password: str, full_name: str) -> Dict[str, Any]:
        try:
            logger.info(f"Attempting to sign up user: {email}")
            
            # Create the user
            try:
                logger.info("Calling auth.sign_up...")
                auth_response = self.client.auth.sign_up({
                    "email": email,
                    "password": password
                })
                logger.info(f"Auth signup response: {auth_response}")
            except Exception as auth_error:
                logger.error(f"Auth signup failed with error: {str(auth_error)}")
                raise Exception(f"Auth signup failed: {str(auth_error)}")
            
            if not auth_response.user:
                logger.error("No user returned from auth signup")
                raise Exception("Failed to create user - no user returned")
            
            # Create profile using service role client to bypass RLS
            try:
                profile_data = {
                    "id": auth_response.user.id,
                    "full_name": full_name,
                    "credits": 0,
                    "subscription_status": "free"
                }
                
                logger.info(f"Attempting to create profile with data: {profile_data}")
                profile_response = self.service_client.table("profiles").insert(profile_data).execute()
                logger.info(f"Profile creation response: {profile_response}")
                
                if not profile_response.data:
                    logger.error("No data returned from profile creation")
                    raise Exception("Failed to create user profile - no data returned")
                
            except Exception as profile_error:
                logger.error(f"Profile creation failed: {str(profile_error)}")
                # Try to clean up the auth user if profile creation fails
                try:
                    if auth_response.user:
                        logger.info(f"Attempting to clean up auth user: {auth_response.user.id}")
                        self.service_client.auth.admin.delete_user(auth_response.user.id)
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up auth user after profile creation failure: {str(cleanup_error)}")
                raise Exception(f"Profile creation failed: {str(profile_error)}")
            
            logger.info("Sign up and profile creation successful")
            return auth_response
            
        except Exception as e:
            logger.error(f"Sign up error: {str(e)}")
            raise

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        try:
            logger.info(f"Attempting to sign in user: {email}")
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            logger.info("Sign in successful")
            return response
        except Exception as e:
            logger.error(f"Sign in error: {str(e)}")
            raise

    async def sign_out(self) -> None:
        try:
            logger.info("Attempting to sign out")
            self.client.auth.sign_out()
            logger.info("Sign out successful")
        except Exception as e:
            logger.error(f"Sign out error: {str(e)}")
            raise

    async def get_session(self) -> Optional[Dict[str, Any]]:
        try:
            logger.info("Attempting to get session")
            session = self.client.auth.get_session()
            logger.info("Successfully retrieved session")
            return session
        except Exception as e:
            logger.error(f"Get session error: {str(e)}")
            return None

# Create a singleton instance
supabase_service = SupabaseService() 