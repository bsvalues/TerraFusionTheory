"""
Direct ACI Integration for GAMA

This module provides direct access to ACI functionalities without the class-based approach,
focusing on simplicity and direct execution.
"""

import os
import sys
import json
import logging
import traceback
from aci import ACI
from aci.types.enums import FunctionDefinitionFormat, SecurityScheme

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("aci-direct")

# Get ACI API key from environment
ACI_API_KEY = os.environ.get("ACI_API_KEY", "")
GAMA_USER_ID = "gama-system"

# Log API key status (without revealing the actual key)
if ACI_API_KEY:
    logger.info(f"ACI API key found, length: {len(ACI_API_KEY)}")
else:
    logger.warning("ACI API key not found or empty")

def is_initialized():
    """
    Check if ACI is initialized with valid API key
    """
    if not ACI_API_KEY:
        logger.error("ACI API key is missing or empty")
        return False
    return True

def get_tools_json_schema(format=FunctionDefinitionFormat.OPENAI):
    """
    Get all available ACI tools in JSON schema format
    
    Returns:
        List of function schemas
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return []
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        schemas = client.list_functions_as_schema(
            format=format,
            allowed_apps_only=True
        )
        return schemas
    except Exception as e:
        logger.error(f"Error getting ACI tools: {e}")
        return []

def search_functions(intent, limit=10):
    """
    Search for ACI functions based on intent
    
    Args:
        intent: Natural language description of what you want to do
        limit: Maximum number of functions to return
        
    Returns:
        List of matching functions
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return []
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        functions = client.functions.search(
            intent=intent,
            allowed_apps_only=True,
            limit=limit
        )
        
        # Format the result
        formatted_functions = []
        for func in functions:
            formatted_functions.append({
                "app_name": func.app_name,
                "function_name": func.function_name,
                "full_name": f"{func.app_name}__{func.function_name}",
                "description": func.description,
                "requires_auth": func.requires_auth,
                "has_linked_account": func.has_linked_account,
                "schema": func.schema
            })
        
        return formatted_functions
    except Exception as e:
        logger.error(f"Error searching functions: {e}")
        return []

def execute_function(app_name, function_name, parameters=None):
    """
    Execute an ACI function directly
    
    Args:
        app_name: Name of the app (e.g., "BRAVE_SEARCH")
        function_name: Name of the function (e.g., "WEB_SEARCH")
        parameters: Parameters for the function execution
        
    Returns:
        Result of the function execution
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return {"error": "ACI not initialized"}
    
    if parameters is None:
        parameters = {}
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        result = client.functions.execute(
            app_name=app_name,
            function_name=function_name,
            parameters=parameters,
            linked_account_owner_id=GAMA_USER_ID
        )
        return result
    except Exception as e:
        logger.error(f"Error executing function {app_name}.{function_name}: {e}")
        return {"error": str(e)}

def handle_function_call(function_name, arguments):
    """
    Handle a function call, both for meta functions and app-specific functions
    
    Args:
        function_name: Name of the function to call
        arguments: Arguments for the function
        
    Returns:
        Result of the function call
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return {"error": "ACI not initialized"}
    
    try:
        # For functions from specific apps (format: APP_NAME__FUNCTION_NAME)
        if "__" in function_name:
            app_name, func_name = function_name.split("__", 1)
            return execute_function(app_name, func_name, arguments)
        
        # For meta functions
        elif function_name == "ACI_SEARCH_FUNCTIONS":
            intent = arguments.get("intent", "")
            limit = arguments.get("limit", 10)
            return {"functions": search_functions(intent, limit)}
        
        elif function_name == "ACI_EXECUTE_FUNCTION":
            func_name = arguments.get("function_name", "")
            func_args = arguments.get("function_arguments", {})
            
            if not func_name:
                return {"error": "No function name provided"}
            
            # If the function name has app name prefix
            if "__" in func_name:
                app_name, function_name = func_name.split("__", 1)
                return execute_function(app_name, function_name, func_args)
            else:
                return {"error": f"Invalid function name format: {func_name}. Expected format: APP_NAME__FUNCTION_NAME"}
        
        else:
            return {"error": f"Unknown function: {function_name}"}
            
    except Exception as e:
        logger.error(f"Error handling function call {function_name}: {e}")
        return {"error": str(e)}

def list_available_apps():
    """
    List all available apps in ACI
    
    Returns:
        List of available apps
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return []
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        apps = client.apps.search(limit=50)
        return [{"name": app.name, "description": app.description} for app in apps]
    except Exception as e:
        logger.error(f"Error listing apps: {e}")
        return []

def link_api_key_account(app_name, api_key):
    """
    Link an account using an API key
    
    Args:
        app_name: Name of the app to link
        api_key: API key for the app
        
    Returns:
        Result of the account linking process
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return {"error": "ACI not initialized"}
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        result = client.linked_accounts.link(
            app_name=app_name,
            linked_account_owner_id=GAMA_USER_ID,
            security_scheme=SecurityScheme.API_KEY,
            api_key=api_key
        )
        return {"status": "success", "result": result}
    except Exception as e:
        logger.error(f"Error linking account for {app_name}: {e}")
        return {"status": "error", "message": str(e)}

def get_oauth_link(app_name, redirect_url=None):
    """
    Get OAuth link for linking an account
    
    Args:
        app_name: Name of the app to link
        redirect_url: URL to redirect to after OAuth flow
        
    Returns:
        OAuth URL for the user to complete the flow
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return {"error": "ACI not initialized"}
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        oauth_url = client.linked_accounts.link(
            app_name=app_name,
            linked_account_owner_id=GAMA_USER_ID,
            security_scheme=SecurityScheme.OAUTH2,
            after_oauth2_link_redirect_url=redirect_url
        )
        return {"status": "success", "oauth_url": oauth_url}
    except Exception as e:
        logger.error(f"Error getting OAuth link for {app_name}: {e}")
        return {"status": "error", "message": str(e)}

def get_linked_accounts():
    """
    Get all linked accounts
    
    Returns:
        List of linked accounts
    """
    if not is_initialized():
        logger.warning("ACI not initialized. Check API key.")
        return []
    
    try:
        client = ACI(api_key=ACI_API_KEY)
        accounts = client.linked_accounts.list(
            linked_account_owner_id=GAMA_USER_ID
        )
        return [{"app_name": acc.app_name, "status": acc.status} for acc in accounts]
    except Exception as e:
        logger.error(f"Error getting linked accounts: {e}")
        return []

# For testing when run directly
if __name__ == "__main__":
    print("ACI Integration Initialized:", is_initialized())
    print("Available Tools:", len(get_tools_json_schema()))