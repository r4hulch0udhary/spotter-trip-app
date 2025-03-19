from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Trip
from .models import UserLocation


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password','email','first_name','last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    


# class TripSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Trip
#         fields = '__all__'

class UserLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLocation
        fields = ["user", "latitude", "longitude", "updated_at"]
