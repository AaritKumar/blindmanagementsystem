# tsa_project/middleware.py

class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Add the permissions policy to allow camera access for the site itself.
        # This is crucial for the QR scanner functionality.
        response['Permissions-Policy'] = 'camera=("self")'
        return response
