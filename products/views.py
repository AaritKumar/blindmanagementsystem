
def get_product_data(request, unique_slug):
    """
    API endpoint to fetch product details. This is used by the scanner
    to get the text-to-speech content without a full page reload,
    creating a seamless single-page-app-like experience.
    """
    product = get_object_or_404(Product, unique_slug=unique_slug)
    data = {
        'name': product.name,
        'text_description': product.text_description,
    }
    return JsonResponse(data)
