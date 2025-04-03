from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    current_latitude = models.FloatField(default=0.0)
    current_longitude = models.FloatField(default=0.0)

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
    start_time = models.DateTimeField(default=now)  # Add this line


    def __str__(self):
        return f"Trip: {self.pickup_city} → {self.dropoff_city}"

