# API Deprecation Schedule

## Overview

This document outlines the deprecation schedule for legacy API endpoints as part of the migration from session-based authentication to JWT-based authentication. All legacy API endpoints have been updated to redirect to their v1 equivalents with a 308 Permanent Redirect status code.

## Monitoring Usage

The usage of deprecated endpoints is being monitored through the `DeprecationLog` model, which logs the following information:
- Timestamp
- Endpoint
- HTTP Method
- IP Address
- User Agent
- User ID (if authenticated)
- Deprecation Version
- Alternative URL

This monitoring will help us identify which clients are still using the deprecated endpoints and target them for migration assistance.

## Deprecation Timeline

### Phase 1: Redirection (Current Phase)
- **Start Date**: [Current Date]
- **Duration**: 3 months
- **Actions**:
  - All legacy API endpoints redirect to their v1 equivalents with a 308 Permanent Redirect status code
  - Deprecation notices are included in response headers and body
  - Usage of deprecated endpoints is logged
  - Clients are encouraged to update their code to use the v1 API endpoints

### Phase 2: Warning Period
- **Start Date**: 3 months after Phase 1
- **Duration**: 3 months
- **Actions**:
  - Continue redirecting legacy API endpoints to their v1 equivalents
  - Increase visibility of deprecation notices
  - Directly contact clients still using deprecated endpoints based on monitoring data
  - Provide additional migration assistance as needed

### Phase 3: Removal
- **Start Date**: 6 months after Phase 1
- **Actions**:
  - Remove legacy API endpoints
  - Return 410 Gone status code for requests to removed endpoints
  - Provide clear error messages directing clients to the v1 API endpoints

## Criteria for Safe Removal

Legacy API endpoints will be considered safe for removal when:
1. Usage has dropped below 1% of total API requests
2. No critical clients are still using the deprecated endpoints
3. Adequate notice has been given (minimum 6 months)
4. Migration assistance has been provided to all identified clients

## Communication Plan

1. **Documentation Updates**:
   - Update API documentation to clearly mark deprecated endpoints
   - Provide migration guides for each endpoint
   - Include code examples for using the v1 API endpoints

2. **Client Notifications**:
   - Send email notifications to registered API users
   - Display deprecation notices in the developer portal
   - Include deprecation information in API responses

3. **Direct Outreach**:
   - Contact clients still using deprecated endpoints based on monitoring data
   - Offer migration assistance and support
   - Provide custom migration plans for high-volume users

## Exceptions

In exceptional cases, the deprecation timeline may be extended for specific endpoints if:
1. Critical clients require additional time for migration
2. Technical limitations prevent timely migration
3. Business requirements necessitate continued support

Any exceptions must be documented and approved by the API governance team.

## Conclusion

This deprecation schedule provides a clear timeline and criteria for safely removing legacy API endpoints while minimizing disruption to clients. By monitoring usage and providing ample notice and assistance, we can ensure a smooth transition to the v1 API endpoints.