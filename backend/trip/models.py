from django.db import models
from django.contrib.auth.models import User

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Pickup details
    pickup_city = models.CharField(max_length=100,blank=True)  # Stores the city name
    pickup_latitude = models.FloatField(default=0.0)
    pickup_longitude = models.FloatField(default=0.0)

    # Drop-off details
    dropoff_city = models.CharField(max_length=100,blank=True)  # Stores the city name
    dropoff_latitude = models.FloatField(default=0.0)
    dropoff_longitude = models.FloatField(default=0.0)

    # Driving cycle (max 70 hours per week)
    cycle_hours = models.IntegerField(default=0)

    # Route details (OSRM API)
    distance_km = models.FloatField(null=True, blank=True)  # Distance in KM
    duration_hours = models.CharField(max_length=100,null=True, blank=True)  # Duration in hours
    route_data = models.JSONField(null=True, blank=True)  # Full route data

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip: {self.pickup_city} → {self.dropoff_city}"


class UserLocation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.latitude}, {self.longitude}"