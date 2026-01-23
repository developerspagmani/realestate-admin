# Integration Plan: 99acres Third-Party Module

This document outlines the implementation strategy for integrating the current platform with **99acres.com** via an automated API Hook.

## 1. Overview
The goal is to create a pluggable module named **"Integration Third-Party"** that synchronizes property listings from our platform to 99acres.com in real-time.

## 2. Module Definition
- **Name**: Integration Third-Party
- **Slug**: `integration-third-party`
- **Target System**: 99acres.com (Real Estate Portal)
- **Integration Type**: REST API / Webhook Hook

## 3. Architecture Phase
We will implement an **Event-Driven Service** to handle synchronization in the background.

### Data Flow:
1. **Trigger**: User creates or updates a property in the dashboard.
2. **Hook**: Property Controller checks for the `integration-third-party` module status.
3. **Queue**: If active, the system adds a job to a background worker.
4. **Transform**: `IntegrationService` maps platform fields to 99acres API schema.
5. **Sync**: System performs the REST call to 99acres and stores the external ID.

## 4. Database Schema Requirements
To track synchronization, the following updates are proposed:

### Property Table Updates:
- `ninetyAcresId`: (String) Store the unique reference from 99acres.
- `syncStatus`: (Int) 1: Pending, 2: Synced, 3: Failed.
- `lastSyncAt`: (DateTime) Timestamp of the last successful push.

### Integration Log Table (New):
- `id`: UUID
- `entityId`: UUID (Property ID)
- `requestPayload`: JSON
- `responsePayload`: JSON
- `statusCode`: Int
- `errorLog`: Text

## 5. Implementation Roadmap

### Phase 1: Authentication & Mapping
- Support OAuth2 or API Key authentication as per 99acres developer docs.
- Create a mapping utility for Property Types (e.g., our "Flat" -> 99acres "Apartment").

### Phase 2: Configuration UI
- Add an "Integrations" section in the Owner Admin Dashboard.
- Provide input fields for API Credentials (Client ID, Secret, Username).
- Toggle switch to enable/disable auto-sync.

### Phase 3: The API Service
- Implement `api/src/services/IntegrationService.js`.
- Methods:
    - `syncProperty(propertyId)`
    - `updateListing(propertyId)`
    - `removeListing(propertyId)`

### Phase 4: Validation & Error Handling
- Pre-sync validation (Ensure mandatory 99acres fields like locality and price are present).
- Retry logic for temporary network failures.

## 6. Key API Requirements (99acres)
- **Image URLs**: 99acres requires high-resolution direct links.
- **Location Mapping**: Cities and localities must match 99acres' internal master ID list.
- **Rate Limits**: Implementation must respect the portal's API request limits (throttling).

---
**Status**: Planning Only
**Created**: 2026-01-21
