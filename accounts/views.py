from django.contrib.auth import authenticate, login
from django.shortcuts import redirect, render
from django.views import View

from .forms import SimpleLoginForm, SimpleSignupForm


class SignupView(View):
    form_class = SimpleSignupForm
    template_name = 'accounts/signup.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
        return render(request, self.template_name, {'form': form})


class LoginView(View):
    form_class = SimpleLoginForm
    template_name = 'accounts/login.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if not form.cleaned_data.get('remember_me'):
                    request.session.set_expiry(0)
                return redirect('dashboard')
        return render(request, self.template_name, {'form': form})
