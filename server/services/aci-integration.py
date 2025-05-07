"""
ACI Integration Service for GAMA

This module integrates the ACI (Agent-Computer Interface) platform from aipotheosis-labs
into our Geographic Assisted Mass Appraisal (GAMA) system, providing access to 600+ external tools.
"""

import os
import json
import logging
from aci._client import ACI
from aci.meta_functions import ACISearchFunctions, ACIExecuteFunction
from aci.types.enums import FunctionDefinitionFormat, SecurityScheme
from flask import jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aci-integration")

class ACIIntegration:
    def __init__(self):
        """Initialize the ACI integration service"""
        self.api_key = os.environ.get("ACI_API_KEY")
        self.is_initialized = False
        self.client = None
        
        # Default user ID for the GAMA system
        self.gama_user_id = "gama_system_user"
        
        # Real estate related app names 
        self.real_estate_apps = [
            "GOOGLE_MAPS",
            "BRAVE_SEARCH",
            "GOOGLE_DRIVE",
            "GMAIL",
            "ZILLOW",
            "GOOGLE_SHEETS",
            "OPENWEATHERMAP",
            "CENSUS", 
            "WIKIPEDIA",
        ]
        
        self.initialize()
    
    def initialize(self):
        """Initialize the ACI client and validate API key"""
        if not self.api_key:
            logger.warning("ACI_API_KEY not found in environment variables")
            return
        
        try:
            self.client = ACI(api_key=self.api_key)
            # Verify the API key by making a simple call
            test = self.client.apps.search(limit=1)
            self.is_initialized = True
            logger.info("ACI integration initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ACI client: {e}")
            self.is_initialized = False
    
    def get_tools_json_schema(self, format=FunctionDefinitionFormat.OPENAI):
        """
        Get JSON schema for ACI meta functions, ready to use as LLM tools
        
        Args:
            format: The format for the function definition (OpenAI, Anthropic, etc.)
            
        Returns:
            List of function schemas in the requested format
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return []
        
        try:
            tools = [
                ACISearchFunctions.to_json_schema(format),
                ACIExecuteFunction.to_json_schema(format)
            ]
            return tools
        except Exception as e:
            logger.error(f"Error getting tool schemas: {e}")
            return []
    
    def search_functions(self, intent, allowed_apps_only=True, limit=10):
        """
        Search for ACI functions based on a natural language intent
        
        Args:
            intent: Natural language description of the task
            allowed_apps_only: Only return functions from apps the user has access to
            limit: Maximum number of functions to return
            
        Returns:
            List of functions matching the intent
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return []
        
        try:
            functions = self.client.functions.search(
                intent=intent,
                allowed_apps_only=allowed_apps_only,
                limit=limit
            )
            
            # Format the result in a way that's useful for our application
            formatted_functions = []
            for func in functions:
                formatted_functions.append({
                    "app_name": func.app_name,
                    "function_name": func.function_name,
                    "description": func.description,
                    "requires_auth": func.requires_auth,
                    "has_linked_account": func.has_linked_account,
                    "schema": func.schema
                })
            
            return formatted_functions
        except Exception as e:
            logger.error(f"Error searching functions: {e}")
            return []
    
    def execute_function(self, app_name, function_name, parameters=None):
        """
        Execute an ACI function
        
        Args:
            app_name: Name of the app (e.g., "BRAVE_SEARCH")
            function_name: Name of the function (e.g., "WEB_SEARCH")
            parameters: Parameters for the function execution
            
        Returns:
            Result of the function execution
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return {"error": "ACI not initialized"}
        
        if parameters is None:
            parameters = {}
        
        try:
            result = self.client.functions.execute(
                app_name=app_name,
                function_name=function_name,
                parameters=parameters,
                linked_account_owner_id=self.gama_user_id
            )
            return result
        except Exception as e:
            logger.error(f"Error executing function {app_name}.{function_name}: {e}")
            return {"error": str(e)}
    
    def handle_function_call(self, function_name, arguments):
        """
        Handle both direct function calls and meta function calls
        
        Args:
            function_name: Name of the function to call
            arguments: Arguments for the function
            
        Returns:
            Result of the function call
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return {"error": "ACI not initialized"}
        
        try:
            # Get the client
            client = self.client
            
            # For functions from specific apps (format: APP_NAME__FUNCTION_NAME)
            if "__" in function_name:
                app_name, func_name = function_name.split("__", 1)
                
                # Execute the function directly
                result = client.functions.execute(
                    app_name=app_name,
                    function_name=func_name,
                    parameters=arguments, 
                    linked_account_owner_id=self.gama_user_id
                )
                return result
            
            # For meta functions (ACI_SEARCH_FUNCTIONS, ACI_EXECUTE_FUNCTION)
            elif function_name == "ACI_SEARCH_FUNCTIONS":
                intent = arguments.get("intent", "")
                limit = arguments.get("limit", 10)
                offset = arguments.get("offset", 0)
                
                functions = client.functions.search(
                    intent=intent,
                    allowed_apps_only=True,
                    limit=limit,
                    offset=offset
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
                
                return {"functions": formatted_functions}
            
            elif function_name == "ACI_EXECUTE_FUNCTION":
                func_name = arguments.get("function_name", "")
                func_args = arguments.get("function_arguments", {})
                
                if not func_name:
                    return {"error": "No function name provided"}
                
                # If the function name has app name prefix
                if "__" in func_name:
                    app_name, function_name = func_name.split("__", 1)
                    
                    result = client.functions.execute(
                        app_name=app_name,
                        function_name=function_name,
                        parameters=func_args,
                        linked_account_owner_id=self.gama_user_id
                    )
                    return result
                else:
                    return {"error": f"Invalid function name format: {func_name}. Expected format: APP_NAME__FUNCTION_NAME"}
            
            else:
                return {"error": f"Unknown function: {function_name}"}
                
        except Exception as e:
            logger.error(f"Error handling function call {function_name}: {e}")
            return {"error": str(e)}
    
    def list_available_apps(self):
        """
        List all available apps in ACI
        
        Returns:
            List of available apps
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return []
        
        try:
            apps = self.client.apps.search(limit=50)
            return [{"name": app.name, "description": app.description} for app in apps]
        except Exception as e:
            logger.error(f"Error listing apps: {e}")
            return []
    
    def configure_real_estate_apps(self):
        """
        Configure commonly used real estate apps for the GAMA system
        
        Returns:
            Status of configuration process
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return {"status": "error", "message": "ACI not initialized"}
        
        results = []
        
        for app_name in self.real_estate_apps:
            try:
                # Check if app configuration already exists
                existing_configs = self.client.app_configurations.list(app_names=[app_name])
                
                if existing_configs and len(existing_configs) > 0:
                    results.append({
                        "app_name": app_name,
                        "status": "already_configured"
                    })
                    continue
                
                # Get app details to determine security scheme
                app_details = self.client.apps.get(app_name=app_name)
                security_schemes = app_details.security_schemes
                
                # Default to no_auth if available
                if "NO_AUTH" in security_schemes:
                    config = self.client.app_configurations.create(
                        app_name=app_name,
                        security_scheme=SecurityScheme.NO_AUTH
                    )
                    results.append({
                        "app_name": app_name,
                        "status": "configured",
                        "security_scheme": "NO_AUTH"
                    })
                # Then try api_key if available
                elif "API_KEY" in security_schemes:
                    # For API_KEY we need to get the key from the user
                    results.append({
                        "app_name": app_name,
                        "status": "needs_api_key",
                        "security_scheme": "API_KEY"
                    })
                # Finally try oauth2 if available
                elif "OAUTH2" in security_schemes:
                    results.append({
                        "app_name": app_name,
                        "status": "needs_oauth",
                        "security_scheme": "OAUTH2"
                    })
                else:
                    results.append({
                        "app_name": app_name,
                        "status": "unsupported_security_scheme",
                        "security_schemes": security_schemes
                    })
            except Exception as e:
                logger.error(f"Error configuring app {app_name}: {e}")
                results.append({
                    "app_name": app_name,
                    "status": "error",
                    "message": str(e)
                })
        
        return {"status": "complete", "results": results}
    
    def link_api_key_account(self, app_name, api_key):
        """
        Link an account using an API key
        
        Args:
            app_name: Name of the app to link
            api_key: API key for the app
            
        Returns:
            Result of the account linking process
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return {"error": "ACI not initialized"}
        
        try:
            result = self.client.linked_accounts.link(
                app_name=app_name,
                linked_account_owner_id=self.gama_user_id,
                security_scheme=SecurityScheme.API_KEY,
                api_key=api_key
            )
            return {"status": "success", "result": result}
        except Exception as e:
            logger.error(f"Error linking account for {app_name}: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_oauth_link(self, app_name, redirect_url=None):
        """
        Get OAuth link for linking an account
        
        Args:
            app_name: Name of the app to link
            redirect_url: URL to redirect to after OAuth flow
            
        Returns:
            OAuth URL for the user to complete the flow
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return {"error": "ACI not initialized"}
        
        try:
            oauth_url = self.client.linked_accounts.link(
                app_name=app_name,
                linked_account_owner_id=self.gama_user_id,
                security_scheme=SecurityScheme.OAUTH2,
                after_oauth2_link_redirect_url=redirect_url
            )
            return {"status": "success", "oauth_url": oauth_url}
        except Exception as e:
            logger.error(f"Error getting OAuth link for {app_name}: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_linked_accounts(self):
        """
        Get all linked accounts for the GAMA system
        
        Returns:
            List of linked accounts
        """
        if not self.is_initialized:
            logger.warning("ACI not initialized. Check API key.")
            return []
        
        try:
            accounts = self.client.linked_accounts.list(
                linked_account_owner_id=self.gama_user_id
            )
            return [{"app_name": acc.app_name, "status": acc.status} for acc in accounts]
        except Exception as e:
            logger.error(f"Error getting linked accounts: {e}")
            return []

# Create a singleton instance
aci_integration = ACIIntegration()

# Flask route handlers
def search_aci_functions_handler(request):
    """Handler for searching ACI functions"""
    intent = request.json.get('intent', '')
    limit = request.json.get('limit', 10)
    
    if not intent:
        return jsonify({"error": "Intent is required"}), 400
    
    functions = aci_integration.search_functions(intent, limit=limit)
    return jsonify({
        "status": "success",
        "count": len(functions),
        "functions": functions
    })

def execute_aci_function_handler(request):
    """Handler for executing an ACI function"""
    app_name = request.json.get('app_name', '')
    function_name = request.json.get('function_name', '')
    parameters = request.json.get('parameters', {})
    
    if not app_name or not function_name:
        return jsonify({"error": "App name and function name are required"}), 400
    
    result = aci_integration.execute_function(app_name, function_name, parameters)
    return jsonify({
        "status": "success",
        "result": result
    })

def handle_function_call_handler(request):
    """Handler for unified function call handling"""
    function_name = request.json.get('function_name', '')
    arguments = request.json.get('arguments', {})
    
    if not function_name:
        return jsonify({"error": "Function name is required"}), 400
    
    result = aci_integration.handle_function_call(function_name, arguments)
    return jsonify({
        "status": "success",
        "result": result
    })

def list_available_apps_handler(request):
    """Handler for listing available apps"""
    apps = aci_integration.list_available_apps()
    return jsonify({
        "status": "success",
        "count": len(apps),
        "apps": apps
    })

def configure_real_estate_apps_handler(request):
    """Handler for configuring real estate apps"""
    result = aci_integration.configure_real_estate_apps()
    return jsonify(result)

def link_api_key_account_handler(request):
    """Handler for linking an account with API key"""
    app_name = request.json.get('app_name', '')
    api_key = request.json.get('api_key', '')
    
    if not app_name or not api_key:
        return jsonify({"error": "App name and API key are required"}), 400
    
    result = aci_integration.link_api_key_account(app_name, api_key)
    return jsonify(result)

def get_oauth_link_handler(request):
    """Handler for getting OAuth link"""
    app_name = request.json.get('app_name', '')
    redirect_url = request.json.get('redirect_url', None)
    
    if not app_name:
        return jsonify({"error": "App name is required"}), 400
    
    result = aci_integration.get_oauth_link(app_name, redirect_url)
    return jsonify(result)

def get_linked_accounts_handler(request):
    """Handler for getting linked accounts"""
    accounts = aci_integration.get_linked_accounts()
    return jsonify({
        "status": "success",
        "count": len(accounts),
        "accounts": accounts
    })

# Example usage
if __name__ == "__main__":
    # Test ACI integration
    print("ACI Integration Status:", aci_integration.is_initialized)
    
    if aci_integration.is_initialized:
        # Example: Search for functions related to real estate
        functions = aci_integration.search_functions("real estate property search", limit=5)
        print(f"Found {len(functions)} functions for real estate search")
        
        # Example: List available apps
        apps = aci_integration.list_available_apps()
        print(f"Available apps: {len(apps)}")
        
        # Example: Configure real estate apps
        config_result = aci_integration.configure_real_estate_apps()
        print("Configuration result:", config_result["status"])