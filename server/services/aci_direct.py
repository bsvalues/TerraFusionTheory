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
from aci._client import ACI
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
        logger.info(f"Getting ACI tools in {format} format")
        client = ACI(api_key=ACI_API_KEY)
        
        # Get available functions via search instead
        logger.info("Using search to get available functions")
        functions = client.functions.search(
            intent="list all available functions",
            allowed_apps_only=True,
            limit=50
        )
        
        logger.info(f"Found {len(functions)} functions")
        
        # Format as JSON schema
        schemas = []
        for func in functions:
            try:
                if isinstance(func, dict):
                    schema = func.get('schema', {})
                    schemas.append(schema)
                else:
                    schema = getattr(func, 'schema', {})
                    schemas.append(schema)
            except Exception as schema_error:
                logger.error(f"Error processing schema: {schema_error}")
                
        logger.info(f"Returning {len(schemas)} function schemas")
        return schemas
    except Exception as e:
        logger.error(f"Error getting ACI tools: {e}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
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
        # Log the search attempt
        logger.info(f"Searching ACI functions with intent: '{intent}' and limit: {limit}")
        
        # Import detailed debug information
        import inspect
        import traceback
        
        # Create client with more detailed logging
        logger.info("Creating ACI client...")
        client = ACI(api_key=ACI_API_KEY)
        logger.info("ACI client created successfully")
        
        # Execute search with enhanced error trapping
        logger.info("Executing function search...")
        try:
            functions = client.functions.search(
                intent=intent,
                allowed_apps_only=True,
                limit=limit
            )
            logger.info(f"Search completed successfully, found {len(functions)} functions")
        except Exception as search_error:
            # Get detailed error information
            error_type = type(search_error).__name__
            error_traceback = traceback.format_exc()
            error_frame = inspect.trace()[-1]
            error_file = error_frame[1]
            error_line = error_frame[2]
            error_context = error_frame[4]
            
            logger.error(f"Search execution error ({error_type} at {error_file}:{error_line}): {str(search_error)}")
            logger.error(f"Error context: {error_context}")
            logger.error(f"Traceback: {error_traceback}")
            
            # Re-raise to handle it in the outer exception
            raise
        
        # Format the result
        logger.info("Formatting search results...")
        formatted_functions = []
        for func in functions:
            # Handle both object and dictionary formats
            if isinstance(func, dict):
                app_name = func.get('app_name', '')
                function_name = func.get('function_name', '')
                description = func.get('description', '')
                requires_auth = func.get('requires_auth', False)
                has_linked_account = func.get('has_linked_account', False)
                schema = func.get('schema', {})
            else:
                # Assume object with attributes
                app_name = getattr(func, 'app_name', '')
                function_name = getattr(func, 'function_name', '')
                description = getattr(func, 'description', '')
                requires_auth = getattr(func, 'requires_auth', False)
                has_linked_account = getattr(func, 'has_linked_account', False)
                schema = getattr(func, 'schema', {})
                
            formatted_functions.append({
                "app_name": app_name,
                "function_name": function_name,
                "full_name": f"{app_name}__{function_name}",
                "description": description,
                "requires_auth": requires_auth,
                "has_linked_account": has_linked_account,
                "schema": schema
            })
        
        logger.info(f"Returning {len(formatted_functions)} formatted functions")
        return formatted_functions
    except Exception as e:
        # Capture and log the error details
        logger.error(f"Error searching functions: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        
        # Return an error object to provide more details to the caller
        error_info = {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        logger.error(f"Returning error information: {error_info}")
        
        return error_info

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
        # Log the function call
        logger.info(f"Executing function {app_name}.{function_name} with parameters: {parameters}")
        
        client = ACI(api_key=ACI_API_KEY)
        
        # Check for function existence
        try:
            logger.info(f"Searching for function {app_name}.{function_name}")
            matching_functions = client.functions.search(
                intent=f"use {app_name} {function_name}",
                allowed_apps_only=True,
                limit=10
            )
            func_found = False
            for func in matching_functions:
                if isinstance(func, dict):
                    if func.get('app_name') == app_name and func.get('function_name') == function_name:
                        func_found = True
                        break
                else:
                    if getattr(func, 'app_name', '') == app_name and getattr(func, 'function_name', '') == function_name:
                        func_found = True
                        break
            
            if not func_found:
                logger.warning(f"Function {app_name}.{function_name} not found in search results")
        except Exception as search_error:
            logger.warning(f"Error searching for function: {search_error}")
        
        # Execute the function
        logger.info(f"Executing ACI function {app_name}.{function_name}")
        result = client.functions.execute(
            function_name=function_name,
            function_arguments=parameters,
            app_name=app_name,
            linked_account_owner_id=GAMA_USER_ID
        )
        
        # Process result
        logger.info(f"Function execution successful: {type(result)}")
        if isinstance(result, dict):
            return result
        else:
            # Convert to dictionary if it's another object type
            logger.info(f"Converting result of type {type(result)} to dictionary")
            try:
                # Try to convert to JSON and back to ensure it's a clean dictionary
                result_json = json.dumps(result)
                return json.loads(result_json)
            except Exception as conversion_error:
                logger.error(f"Error converting result: {conversion_error}")
                # Fallback to string representation
                return {"result": str(result)}
                
    except Exception as e:
        logger.error(f"Error executing function {app_name}.{function_name}: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }

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
        
        formatted_accounts = []
        for acc in accounts:
            if isinstance(acc, dict):
                formatted_accounts.append({
                    "app_name": acc.get("app_name", ""),
                    "status": acc.get("status", "unknown")
                })
            else:
                # Object format
                formatted_accounts.append({
                    "app_name": getattr(acc, "app_name", ""),
                    "status": getattr(acc, "status", "unknown")
                })
        
        return formatted_accounts
    except Exception as e:
        logger.error(f"Error getting linked accounts: {e}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        return []

# For testing when run directly
if __name__ == "__main__":
    print("ACI Integration Initialized:", is_initialized())
    print("Available Tools:", len(get_tools_json_schema()))