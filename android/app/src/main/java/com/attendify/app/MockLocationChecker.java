package com.attendify.app;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "MockLocationChecker",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION
            }
        )
    }
)
public class MockLocationChecker extends Plugin {

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }
        fetchLocation(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            fetchLocation(call);
        } else {
            call.reject("Location permission denied");
        }
    }

    private void fetchLocation(final PluginCall call) {
        Context context = getContext();
        final LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) {
            call.reject("Location services not available");
            return;
        }

        boolean isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        boolean isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);

        if (!isGpsEnabled && !isNetworkEnabled) {
            call.reject("Location providers are disabled");
            return;
        }

        String provider = isGpsEnabled ? LocationManager.GPS_PROVIDER : LocationManager.NETWORK_PROVIDER;

        try {
            // Check last known location first as a quick fallback
            Location lastKnown = locationManager.getLastKnownLocation(provider);
            if (lastKnown != null && (System.currentTimeMillis() - lastKnown.getTime()) < 30000) { // last 30 seconds
                resolveWithLocation(call, lastKnown);
                return;
            }

            // Request single update
            final LocationListener locationListener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    resolveWithLocation(call, location);
                    locationManager.removeUpdates(this);
                }

                @Override
                public void onStatusChanged(String provider, int status, Bundle extras) {}

                @Override
                public void onProviderEnabled(String provider) {}

                @Override
                public void onProviderDisabled(String provider) {}
            };

            locationManager.requestLocationUpdates(
                provider, 
                0, 
                0, 
                locationListener, 
                Looper.getMainLooper()
            );

            // Timeout fallback after 8 seconds
            new android.os.Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        locationManager.removeUpdates(locationListener);
                        Location fallbackLoc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                        if (fallbackLoc == null) {
                            fallbackLoc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                        }
                        if (fallbackLoc != null) {
                            resolveWithLocation(call, fallbackLoc);
                        } else {
                            call.reject("Location timeout");
                        }
                    } catch (SecurityException e) {
                        call.reject("Security Exception: " + e.getMessage());
                    }
                }
            }, 8000);

        } catch (SecurityException e) {
            call.reject("Security Exception: " + e.getMessage());
        } catch (Exception e) {
            call.reject("Error fetching location: " + e.getMessage());
        }
    }

    private void resolveWithLocation(PluginCall call, Location location) {
        boolean isMock = false;
        if (location != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) { // Android 12+ (API 31)
                isMock = location.isMock();
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) { // Android 4.3+ (API 18)
                isMock = location.isFromMockProvider();
            }
        }

        JSObject ret = new JSObject();
        ret.put("latitude", location != null ? location.getLatitude() : 0);
        ret.put("longitude", location != null ? location.getLongitude() : 0);
        ret.put("isMock", isMock);
        call.resolve(ret);
    }
}
