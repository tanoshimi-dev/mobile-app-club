"""
Django management command to seed required article categories.
"""

from django.core.management.base import BaseCommand

from news.models import Category

CATEGORIES = [
    {"name": "Android", "slug": "android"},
    {"name": "iOS", "slug": "ios"},
    {"name": "React Native", "slug": "react-native"},
    {"name": "Flutter", "slug": "flutter"},
    {"name": "Cross-Platform", "slug": "cross-platform"},
]


class Command(BaseCommand):
    help = "Seed the database with required article categories"

    def handle(self, *args, **options):
        for cat in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                slug=cat["slug"],
                defaults={"name": cat["name"]},
            )
            status = "created" if created else "exists"
            self.stdout.write(f"  {cat['name']} ({cat['slug']}): {status}")

        self.stdout.write(
            self.style.SUCCESS(f"Done — {Category.objects.count()} categories total.")
        )
