from django import forms


class BaseInquiryForm(forms.Form):
    name = forms.CharField(required=False, max_length=255)
    email = forms.EmailField(required=False)
    phone = forms.CharField(required=False, max_length=30)
    package = forms.CharField(required=False, max_length=255)
    preferred_date = forms.CharField(required=False, max_length=100)
    preferred_time = forms.CharField(required=False, max_length=100)
    alt_phone = forms.CharField(required=False, max_length=30)
    message = forms.CharField(required=False, widget=forms.Textarea)
    requirements = forms.CharField(required=False, widget=forms.Textarea)


class ReserveYourSpotForm(BaseInquiryForm):
    name = forms.CharField(required=False, max_length=255)
    email = forms.EmailField(required=False)
    phone = forms.CharField(required=False, max_length=30)


class BookPackagesForm(BaseInquiryForm):
    name = forms.CharField(required=False, max_length=255)
    email = forms.EmailField(required=False)
    phone = forms.CharField(required=False, max_length=30)
    package = forms.CharField(required=True, max_length=255)


class TalkToUsForm(BaseInquiryForm):
    name = forms.CharField(required=False, max_length=255)
    email = forms.EmailField(required=False)
    phone = forms.CharField(required=False, max_length=30)
    message = forms.CharField(required=False, widget=forms.Textarea)
