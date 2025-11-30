# ✅ Checklist de Implementación - Google Auth con Firebase

## 📋 Frontend (Next.js) - ✅ COMPLETADO

### Archivos Creados/Modificados

- [x] **`lib/Firebase.ts`** - Configuración y funciones de Firebase
  - `loginWithGoogle()` - Maneja el popup de Google
  - `signOutFirebase()` - Cierra sesión de Firebase
  - `getFirebaseToken()` - Obtiene token actual
  - `isFirebaseAuthenticated()` - Verifica autenticación
  - `getCurrentFirebaseUser()` - Obtiene usuario actual

- [x] **`lib/Auth.ts`** - Añadido método `loginWithGoogle()`
  - Envía `firebase_token` al backend
  - Endpoint: `/auth/google-login`

- [x] **`components/auth/LoginForm.tsx`**
  - Añadida prop `onGoogleLogin`
  - Botón "Continuar con Google"

- [x] **`components/auth/RegisterForm.tsx`**
  - Añadida prop `onGoogleLogin`
  - Botón "Continuar con Google"

- [x] **`app/(auth)/login/page.tsx`**
  - Función `handleGoogleLogin()` implementada
  - Manejo completo del flujo de autenticación

- [x] **`app/(auth)/register/page.tsx`**
  - Función `handleGoogleRegister()` implementada
  - Diferencia entre usuarios nuevos y existentes

### Documentación Creada

- [x] **`docs/GOOGLE-AUTH-ARCHITECTURE.md`**
  - Arquitectura completa del sistema
  - Flujo de autenticación detallado
  - Explicación de tokens
  - Recomendaciones de seguridad
  - Manejo de errores
  - Sincronización de usuarios

- [x] **`docs/backend-google-auth-example.py`**
  - Ejemplos completos de código para FastAPI
  - Configuración de Firebase Admin SDK
  - Modelos, schemas y servicios
  - Endpoints y middleware
  - Tests y variables de entorno

---

## 🚀 Backend (FastAPI) - ⏳ PENDIENTE

### 1. Instalar Dependencias

```bash
pip install firebase-admin python-jose[cryptography] passlib[bcrypt]
```

### 2. Configurar Firebase Admin SDK

- [ ] Ir a [Firebase Console](https://console.firebase.google.com/)
- [ ] Proyecto → Settings → Service Accounts
- [ ] "Generate New Private Key" → Descargar `serviceAccountKey.json`
- [ ] Guardar archivo en lugar seguro (NO commitear a git)

### 3. Variables de Entorno

Añadir a `.env`:

```env
# Firebase Admin SDK (Opción 1: Usar archivo JSON)
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json

# Firebase Admin SDK (Opción 2: Variables individuales - más seguro)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 4. Actualizar Modelo de Usuario

Añadir campos a tu modelo `User`:

```python
class User(Base):
    # ... campos existentes ...
    
    # Nuevos campos para Google Auth
    firebase_uid = Column(String, unique=True, nullable=True, index=True)
    auth_provider = Column(String, default="local")  # "local" o "google"
    profile_image = Column(String, nullable=True)
    
    # Modificar
    password_hash = Column(String, nullable=True)  # Ahora puede ser null
```

### 5. Crear Migración de Base de Datos

```bash
# Crear migración
alembic revision --autogenerate -m "Add Google auth fields"

# Revisar migración generada
cat alembic/versions/xxx_add_google_auth_fields.py

# Aplicar migración
alembic upgrade head
```

### 6. Inicializar Firebase Admin

En tu archivo principal (`main.py` o `app.py`):

```python
from firebase_admin import credentials, initialize_app

# Al inicio de la aplicación
cred = credentials.Certificate("path/to/serviceAccountKey.json")
initialize_app(cred)
```

### 7. Crear Utilidades de Autenticación

Archivo `utils/auth.py`:

```python
from firebase_admin import auth as firebase_auth

def verify_firebase_token(token: str) -> dict:
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except:
        raise HTTPException(401, "Token inválido")
```

### 8. Crear Endpoint `/auth/google-login`

Archivo `routers/auth.py`:

```python
@router.post("/auth/google-login")
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Validar token de Firebase
    decoded_token = verify_firebase_token(request.firebase_token)
    
    # 2. Extraer datos
    email = decoded_token['email']
    name = decoded_token.get('name', email.split('@')[0])
    uid = decoded_token['uid']
    
    # 3. Buscar o crear usuario
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            firebase_uid=uid,
            auth_provider="google",
            email_verified=True
        )
        db.add(user)
        db.commit()
    
    # 4. Generar tokens propios
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # 5. Retornar
    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }
    }
```

### 9. Testing

- [ ] Probar login con cuenta de Google nueva
- [ ] Probar login con cuenta de Google existente
- [ ] Probar vinculación de cuenta local con Google
- [ ] Probar token inválido (debe retornar 401)
- [ ] Probar token expirado (debe retornar 401)

---

## 🔐 Seguridad

### Frontend

- [x] Tokens en cookies (httpOnly cuando sea posible)
- [x] Cerrar sesión de Firebase en errores
- [x] Validar estado de autenticación antes de requests
- [x] Manejar errores de popup bloqueado

### Backend

- [ ] Validar TODOS los tokens de Firebase
- [ ] No confiar en datos del frontend sin validar
- [ ] Implementar rate limiting en `/auth/google-login`
- [ ] Logs de intentos de autenticación
- [ ] CORS configurado correctamente
- [ ] HTTPS en producción

---

## 🧪 Testing en Desarrollo

### 1. Frontend

```bash
cd nextjs-cisnatura
npm run dev
```

Visitar: http://localhost:3000/login
- Click en "Continuar con Google"
- Verificar popup de Google
- Verificar redirección después del login
- Verificar cookies en DevTools

### 2. Backend

```bash
cd backend
uvicorn main:app --reload
```

Probar endpoint:
```bash
curl -X POST http://localhost:8000/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "eyJhbGci..."}'
```

### 3. Base de Datos

Verificar que los usuarios se crean correctamente:

```sql
SELECT id, email, full_name, auth_provider, firebase_uid, email_verified 
FROM users 
WHERE auth_provider = 'google';
```

---

## 📊 Monitoreo Post-Implementación

### Métricas a Revisar

- [ ] Tasa de éxito de login con Google
- [ ] Tasa de error (popup bloqueado, token inválido, etc.)
- [ ] Tiempo promedio de autenticación
- [ ] Usuarios nuevos vs. existentes
- [ ] Conversión: Google vs. Email/Password

### Logs Importantes

```python
# Backend - Agregar logs
logger.info(f"Google login exitoso: {user.email}")
logger.warning(f"Token inválido recibido desde IP: {request.client.host}")
logger.error(f"Error al crear usuario: {str(e)}")
```

### Firebase Console

- Usuarios activos por día
- Métodos de autenticación usados
- Errores de autenticación

---

## 🚨 Troubleshooting

### Problema: Popup bloqueado

**Solución:**
- Asegurarse que el click es un evento real del usuario
- No llamar a `loginWithGoogle()` en un setTimeout
- Pedir al usuario permitir popups para tu sitio

### Problema: Token inválido en backend

**Solución:**
- Verificar que Firebase Admin SDK está inicializado
- Verificar que el project ID coincide
- Verificar que el token no haya expirado (vida útil: 1 hora)

### Problema: Usuario no se crea en BD

**Solución:**
- Verificar que las migraciones se aplicaron
- Verificar que los campos nullable están correctos
- Verificar constraints de unique

### Problema: CORS en producción

**Solución:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Firebase Auth Web](https://firebase.google.com/docs/auth/web/start)
- [Firebase Admin Python](https://firebase.google.com/docs/admin/setup)
- [Google Identity](https://developers.google.com/identity)

### Tutoriales
- [Firebase Auth Best Practices](https://firebase.google.com/docs/auth/web/auth-best-practices)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## ✅ Verificación Final

Antes de ir a producción, verificar:

- [ ] Variables de entorno configuradas correctamente
- [ ] serviceAccountKey.json NO está en git
- [ ] Migraciones aplicadas en producción
- [ ] HTTPS configurado
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Logs configurados
- [ ] Monitoring configurado
- [ ] Backup de base de datos configurado
- [ ] Plan de rollback documentado

---

**Estado Actual:** Frontend ✅ Completado | Backend ⏳ Pendiente

**Próximos Pasos:**
1. Instalar `firebase-admin` en backend
2. Configurar Firebase Admin SDK
3. Crear migración de base de datos
4. Implementar endpoint `/auth/google-login`
5. Probar flujo completo
6. Deploy a producción

**Última actualización:** 29 de noviembre de 2025
