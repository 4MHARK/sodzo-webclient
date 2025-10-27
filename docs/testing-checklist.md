# 🧪 **Profile Integration Testing Guide**

## 🚀 **App Running**

The app is now running at **http://localhost:5174**

## ✅ **Test Checklist**

### **1. Authentication Test**

- [ ] Navigate to http://localhost:5174
- [ ] Login with credentials: `saby@saby.ai` / `@saby_Saby1`
- [ ] Verify successful login and redirect to dashboard

### **2. User Profile Test**

- [ ] Click on "Profile Settings" in the sidebar (under user profile)
- [ ] Navigate to Settings page at http://localhost:5174/settings
- [ ] Click on "User Profile" tab
- [ ] Verify profile data loads (if profile exists)
- [ ] Click "Edit" button to enable edit mode
- [ ] Fill in or update profile fields:
  - Title (Mr., Mrs., Ms., Dr.)
  - Phone Number (+2348012345678 format)
  - Gender (Male/Female)
  - Date of Birth
  - Highest Qualification
  - Professional Title
  - Marital Status
  - Address fields
  - Next of Kin information
  - Employment details
- [ ] Click "Save Changes"
- [ ] Verify optimistic update (instant feedback)
- [ ] Verify success toast notification
- [ ] Refresh page and verify data persisted

### **3. Node Profile Test**

- [ ] Navigate to http://localhost:5174/settings?tab=nodes
- [ ] Click on "Node Profile" tab
- [ ] Verify node data loads (if node profile exists)
- [ ] Fill in or update node profile fields:
  - Node Name
  - Contact Address
  - Property Status (Owned/Rented/Leased)
  - Legal Documents
  - Organization details
  - Financial information
- [ ] Click "Save Changes"
- [ ] Verify optimistic update (instant feedback)
- [ ] Verify success toast notification
- [ ] Refresh page and verify data persisted

### **4. Data Management Test**

- [ ] Navigate to http://localhost:5174/data-test
- [ ] Verify metrics dashboard displays:
  - Cache statistics
  - Network status
  - Sync status
  - API metrics
- [ ] Test endpoint fetch (use: `/users/68fc7feab8f0000012ae8db8`)
- [ ] Verify data loads from cache (check cache hit count)
- [ ] Test mutation with optimistic updates
- [ ] Verify rollback on error

### **5. Projects Marketplace Test**

- [ ] Navigate to http://localhost:5174/projects
- [ ] Verify project forms are displayed in a grid
- [ ] Click on a project form
- [ ] Verify navigation to form renderer
- [ ] Test form rendering functionality

### **6. Storage Test**

- [ ] Navigate to http://localhost:5174/storage
- [ ] Verify storage statistics display
- [ ] Test file upload functionality
- [ ] Test file deletion functionality

### **7. Profile Creation Test (via curl)**

- [ ] Open terminal in project root
- [ ] Run: `./test-profile-creation.sh`
- [ ] Verify UserProfile creation succeeds
- [ ] Verify NodeProfile creation succeeds
- [ ] Verify both profiles can be read

## 🔍 **Expected Results**

### **User Profile**

- ✅ Profile data loads without errors
- ✅ Edit mode toggles correctly
- ✅ Optimistic updates work (instant feedback)
- ✅ Data persists after refresh
- ✅ Error handling works (network errors, validation errors)

### **Node Profile**

- ✅ Node data loads without errors
- ✅ All organization fields display correctly
- ✅ File upload inputs are functional
- ✅ Optimistic updates work
- ✅ Data persists after refresh

### **Data Management**

- ✅ Cache hits increase on repeated requests
- ✅ API calls are minimized (90% reduction)
- ✅ Optimistic updates work with rollback
- ✅ Real-time synchronization functions
- ✅ Network status indicator works

### **Projects & Storage**

- ✅ Real data displays when authenticated
- ✅ Demo mode displays mock data when not authenticated
- ✅ Loading states display correctly
- ✅ Error states handle gracefully

## 🐛 **Known Issues to Watch For**

1. **UserProfile Creation**: May require specific field formats

   - Phone numbers must be in format: `+2348012345678`
   - No dashes or spaces

2. **Network Errors**: If you see 429 errors (Too Many Requests)

   - Cache is working correctly, this is expected
   - Wait a few minutes and retry

3. **Token Expiration**: If you see 401 errors
   - Token refresh should handle this automatically
   - Check console for token refresh logs

## 📊 **Performance Metrics to Monitor**

- **Cache Hit Rate**: Should be >90% after initial load
- **API Call Count**: Should decrease significantly
- **Response Time**: Should be <100ms for cached data
- **Network Status**: Should show "online" when connected
- **Error Rate**: Should be <1% for successful operations

## 🎯 **Success Criteria**

✅ All profile data loads without errors
✅ Optimistic updates work with instant feedback
✅ Data persists after page refresh
✅ Cache reduces API calls by 90%
✅ Error handling is graceful and informative
✅ User experience is smooth and responsive

## 🔧 **Troubleshooting**

### **Issue: Blank white screen**

- Check browser console for errors
- Verify auth token is valid
- Check network tab for failed requests

### **Issue: Profile not loading**

- Verify authentication is successful
- Check browser console for 404 errors
- Verify API endpoints are correct

### **Issue: Optimistic updates not working**

- Verify `IntelligentUserProfileProvider` is properly integrated
- Check console for error messages
- Verify data is being cached

### **Issue: Cache not working**

- Check `localStorage` in browser DevTools
- Verify `dataManager` is properly initialized
- Check console for cache-related logs

## 🎉 **Test Results**

Once testing is complete, document your results:

- [ ] User Profile: Pass/Fail
- [ ] Node Profile: Pass/Fail
- [ ] Data Management: Pass/Fail
- [ ] Projects Marketplace: Pass/Fail
- [ ] Storage: Pass/Fail
- [ ] Profile Creation (curl): Pass/Fail

**Overall Status**: ✅ Pass / ❌ Fail

## 📝 **Notes**

Document any issues encountered, unexpected behaviors, or suggestions for improvement.
