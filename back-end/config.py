import os
from dotenv import load_dotenv

def load_env(env_name: str):
    """
    Load environment variables from a .env file.

    :param env_name: Name of the environment file (without extension).
    """
    env_file = f".env.{env_name}"
    if not os.path.exists(env_file):
        print(f"No environment file found: {env_file}")
    load_dotenv(dotenv_path=env_file)
    print(f"Loaded environment variables from {env_file}")


