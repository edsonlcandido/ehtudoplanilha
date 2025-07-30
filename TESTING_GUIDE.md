# Manual Testing Guide for Automatic Template Copying

## Objective
Test that the Google Sheets template is automatically copied to the user's Drive after OAuth authorization.

## Prerequisites
1. PocketBase running with the updated hooks
2. Google Cloud Console project configured with:
   - Google Sheets API enabled
   - Google Drive API enabled
   - OAuth 2.0 credentials set up
3. Environment variables configured:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
   SHEET_TEMPLATE_ID=your_template_sheet_id
   ```
4. Template spreadsheet created and accessible via the SHEET_TEMPLATE_ID

## Test Scenarios

### Scenario 1: First-time OAuth Authorization (Success)
**Expected Behavior:** Template is automatically copied after authorization

**Steps:**
1. Navigate to `/dashboard/configuracao.html`
2. Click "Autorizar Acesso ao Drive" button
3. Complete Google OAuth flow
4. Verify redirect back to configuration page with success parameters

**Expected Results:**
- Success message: "Autorização concluída e planilha template copiada com sucesso!"
- Green notification appears
- Authorization button changes to "✓ Google Drive Conectado"
- New spreadsheet appears in user's Google Drive with name format: "Controle Financeiro - DD/MM/YYYY"
- `google_infos` record updated with new `sheet_id`

### Scenario 2: OAuth with Existing Sheet (Skip)
**Expected Behavior:** No duplicate copying if user already has a sheet_id

**Steps:**
1. User already has `sheet_id` in `google_infos` table
2. Perform OAuth authorization again
3. Verify no new sheet is created

**Expected Results:**
- Standard OAuth success message
- No new spreadsheet created
- Existing `sheet_id` preserved

### Scenario 3: OAuth Success with Template Copy Failure
**Expected Behavior:** OAuth succeeds but template copying fails gracefully

**Steps:**
1. Set invalid `SHEET_TEMPLATE_ID` in environment
2. Perform OAuth authorization
3. Verify error handling

**Expected Results:**
- Warning message: "Autorização Google concluída, mas houve um problema ao copiar a planilha template automaticamente..."
- Orange notification appears
- OAuth tokens are still saved successfully
- Manual "Copiar Template" button remains available

### Scenario 4: Manual Template Copying
**Expected Behavior:** Manual button works as fallback

**Steps:**
1. Complete OAuth authorization (with or without automatic copying)
2. Click "Copiar Template" button
3. Verify manual copying works

**Expected Results:**
- If no existing sheet: New template copied with success message
- If existing sheet: Message "Você já possui uma planilha configurada!"
- Button shows loading state during operation

### Scenario 5: Token Expiration During Template Copy
**Expected Behavior:** Automatic token refresh during template copying

**Steps:**
1. Use expired access token in `google_infos`
2. Trigger template copying (either automatic or manual)
3. Verify token refresh occurs

**Expected Results:**
- Template copying succeeds after token refresh
- New access token saved to database
- No user intervention required

## Technical Verification Points

### Database Checks
1. **google_infos table:**
   - `access_token` and `refresh_token` saved after OAuth
   - `sheet_id` populated after successful template copying
   - Token refresh updates `access_token` when needed

### API Calls Verification
1. **Google Drive API calls:**
   - POST to `https://www.googleapis.com/drive/v3/files/{templateId}/copy`
   - Proper Authorization header with Bearer token
   - Correct request body with spreadsheet name

### Error Handling
1. **Network failures:** Graceful degradation with user feedback
2. **Missing environment variables:** Clear error messages
3. **Invalid tokens:** Automatic refresh attempt
4. **Missing template:** Informative error message

## Console Log Messages
During testing, look for these console messages:

**Success Flow:**
```
Tentando provisionar planilha template automaticamente...
Copiando template 1ABC123DEF456GHI789 para usuário user_123
Planilha copiada com sucesso: 1NEW456SHEET789ID para usuário user_123
```

**Error Handling:**
```
SHEET_TEMPLATE_ID não configurado
Token expirado, tentando renovar...
Erro ao copiar planilha template: [error details]
```

## Expected Files Created

### New Hook File
- `pb_hooks/provision-sheet.pb.js` - Template copying endpoint

### Modified Files
- `pb_hooks/google-redirect.pb.js` - OAuth callback with automatic provisioning
- `pb_public/dashboard/configuracao.html` - Updated UI with manual button
- `pb_public/js/configuracao.js` - Enhanced feedback handling

## Performance Considerations
- Template copying adds ~1-3 seconds to OAuth flow
- Fallback to manual copying if automatic fails
- Token refresh is transparent to user
- Error states don't block OAuth success