from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.views import View
from .forms import SimpleSignupForm, SimpleLoginForm

# Architectural Decision:
# Class-based views are used to keep the code organized. The SignupView handles
# user creation with the simplified form. The LoginView processes the custom
# form with the 'Remember me' functionality, setting the session expiry accordingly.

class SignupView(View):
    def get(self, request):
        form = SimpleSignupForm()
        return render(request, 'accounts/signup.html', {'form': form})

    def post(self, request):
        form = SimpleSignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
        return render(request, 'accounts/signup.html', {'form': form})

class LoginView(View):
    def get(self, request):
        form = SimpleLoginForm()
        return render(request, 'accounts/login.html', {'form': form})

    def post(self, request):
        form = SimpleLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if not form.cleaned_data.get('remember_me'):
                    # Session expires when browser closes.
                    request.session.set_expiry(0)
                return redirect('dashboard')
        return render(request, 'accounts/login.html', {'form': form})
