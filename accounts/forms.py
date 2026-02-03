from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User


class SimpleSignupForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('username', 'password')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class SimpleLoginForm(AuthenticationForm):
    remember_me = forms.BooleanField(
        required=False, 
        initial=True, 
        widget=forms.CheckboxInput, 
        label="Remember me"
    )
