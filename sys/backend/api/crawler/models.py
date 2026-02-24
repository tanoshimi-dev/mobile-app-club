from django.db import models

from news.models import Source


class CrawlLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success"
        FAILED = "failed"

    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="crawl_logs", db_index=True)
    status = models.CharField(max_length=10, choices=Status.choices, db_index=True)
    articles_found = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(db_index=True)
    finished_at = models.DateTimeField()

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.source.name} — {self.status} ({self.started_at})"
