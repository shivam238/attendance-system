package com.attendify.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MockLocationChecker.class);
        super.onCreate(savedInstanceState);
    }
}

