# Arquitectura de Autenticación con Google (Firebase)

## 📋 Resumen

Este documento explica cómo funciona la integración de Google SSO (Single Sign-On) usando Firebase en el frontend y cómo se sincroniza con tu backend de FastAPI.

## 🏗️ Arquitectura General

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Usuario   │─────▶│  Firebase   │─────▶│  Frontend   │─────▶│   Backend   │
│   (Google)  │      │    Auth     │      │   Next.js   │      │   FastAPI   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
      │                     │                     │                     │
      │  1. Login Google    │                     │                     │
      ├────────────────────▶│                     │                     │
      │                     │                     │                     │
      │  2. Firebase Token  │                     │                     │
      │◀────────────────────┤                     │                     │
      │                     │                     │                     │
      │                     │  3. Firebase Token  │                     │
      │                     ├────────────────────▶│                     │
      │                     │                     │                     │
      │                     │                     │  4. Firebase Token  │
      │                     │                     ├────────────────────▶│
      │                     │                     │                     │
      │                     │                     │  5. Backend Token   │
      │                     │                     │◀────────────────────┤
      │                     │                     │                     │
      │                     │  6. Sesión activa   │                     │
      │◀────────────────────┴─────────────────────┤                     │
      │                                           │                     │
```

## 🔐 Flujo de Autenticación Detallado

### 1. Login con Google (Frontend)

```typescript
// Usuario hace clic en "Continuar con Google"
const googleAuthData = await loginWithGoogle();

// Datos que retorna Firebase:
{
  firebaseToken: "eyJhbGciOiJSUzI1NiIsImtpZCI...", // ← ESTE TOKEN SE ENVÍA AL BACKEND
  user: {
    uid: "Gch6Lys1glSnDhsKAVkrP8WWyA62",
    email: "usuario@gmail.com",
    displayName: "Usuario Nombre",
    photoURL: "https://...",
    emailVerified: true
  },
  googleAccessToken: "ya29.a0ATi6K2uLovaI...", // Token para APIs de Google (opcional)
  isNewUser: true // true si es primera vez que se loguea
}
```

### 2. Envío al Backend

El frontend envía el **firebaseToken** (idToken de Firebase) a tu backend:

```typescript
const response = await AuthAPI.loginWithGoogle({
  firebase_token: googleAuthData.firebaseToken
});
```

### 3. Backend Valida y Crea/Actualiza Usuario

**Tu backend debe:**

1. **Validar el Firebase Token**
   ```python
   # En FastAPI
   import firebase_admin
   from firebase_admin import auth
   
   # Validar el token
   decoded_token = auth.verify_id_token(firebase_token)
   uid = decoded_token['uid']
   email = decoded_token['email']
   name = decoded_token['name']
   ```

2. **Buscar o Crear Usuario en tu Base de Datos**
   ```python
   user = db.query(User).filter(User.email == email).first()
   
   if not user:
       # Usuario nuevo - Crear
       user = User(
           email=email,
           full_name=name,
           firebase_uid=uid,
           email_verified=True,  # Google ya verificó el email
           auth_provider="google"
       )
       db.add(user)
       db.commit()
   else:
       # Usuario existente - Actualizar firebase_uid si no lo tiene
       if not user.firebase_uid:
           user.firebase_uid = uid
           db.commit()
   ```

3. **Generar Tokens de tu Backend**
   ```python
   access_token = create_access_token(data={"sub": user.id})
   refresh_token = create_refresh_token(data={"sub": user.id})
   
   return {
       "access_token": access_token,
       "refresh_token": refresh_token,
       "user": user
   }
   ```

### 4. Frontend Guarda Tokens del Backend

```typescript
// Guardar en cookies
cookieStorage.setAuth(access_token, refresh_token, user);

// Configurar axios para futuras peticiones
AuthAPI.setAuthToken(access_token);
```

## 🔑 Tokens: ¿Cuál Usar?

| Token | Uso | Duración | Dónde se usa |
|-------|-----|----------|--------------|
| **Firebase Token** (idToken) | Validar identidad con Firebase | 1 hora | Backend para validar al usuario |
| **Backend Access Token** | Autorizar peticiones a tu API | 15-30 min | Todas las peticiones a tu backend |
| **Backend Refresh Token** | Renovar access token | 7-30 días | Renovar sesión sin re-login |
| **Google Access Token** | Llamar APIs de Google | 1 hora | Solo si necesitas APIs de Google (Drive, Calendar, etc.) |

## 📝 Recomendaciones de Seguridad

### ✅ Frontend (Next.js)

1. **Nunca almacenes tokens en localStorage**
   - Usa cookies httpOnly cuando sea posible
   - El cookieStorage actual está bien

2. **Valida siempre el estado de Firebase**
   ```typescript
   // Listener de cambios de autenticación
   onAuthStateChanged(auth, (user) => {
     if (!user) {
       // Usuario cerró sesión en Firebase
       // Cerrar sesión en tu backend también
       AuthAPI.logoutAndClear();
     }
   });
   ```

3. **Cierra sesión en ambos lados**
   ```typescript
   async function logout() {
     // 1. Backend
     await AuthAPI.logout();
     
     // 2. Firebase
     await signOutFirebase();
     
     // 3. Cookies
     cookieStorage.clearAuth();
   }
   ```

### ✅ Backend (FastAPI)

1. **Instala Firebase Admin SDK**
   ```bash
   pip install firebase-admin
   ```

2. **Inicializa Firebase Admin**
   ```python
   import firebase_admin
   from firebase_admin import credentials
   
   cred = credentials.Certificate("path/to/serviceAccountKey.json")
   firebase_admin.initialize_app(cred)
   ```

3. **Crea el endpoint de Google Login**
   ```python
   from fastapi import APIRouter, HTTPException, Depends
   from firebase_admin import auth as firebase_auth
   
   router = APIRouter()
   
   @router.post("/auth/google-login")
   async def google_login(firebase_token: str, db: Session = Depends(get_db)):
       try:
           # Validar token de Firebase
           decoded_token = firebase_auth.verify_id_token(firebase_token)
           
           uid = decoded_token['uid']
           email = decoded_token['email']
           name = decoded_token.get('name', email.split('@')[0])
           picture = decoded_token.get('picture')
           
           # Buscar o crear usuario
           user = db.query(User).filter(User.email == email).first()
           
           if not user:
               # Crear nuevo usuario
               user = User(
                   email=email,
                   full_name=name,
                   firebase_uid=uid,
                   profile_image=picture,
                   email_verified=True,
                   is_active=True,
                   auth_provider="google"
               )
               db.add(user)
               db.commit()
               db.refresh(user)
           else:
               # Actualizar firebase_uid si no existe
               if not user.firebase_uid:
                   user.firebase_uid = uid
                   user.email_verified = True
                   db.commit()
           
           # Generar tokens propios
           access_token = create_access_token({"sub": str(user.id)})
           refresh_token = create_refresh_token({"sub": str(user.id)})
           
           return {
               "success": True,
               "data": {
                   "access_token": access_token,
                   "refresh_token": refresh_token,
                   "user": user
               }
           }
           
       except firebase_auth.InvalidIdTokenError:
           raise HTTPException(status_code=401, detail="Token de Firebase inválido")
       except Exception as e:
           raise HTTPException(status_code=500, detail=str(e))
   ```

4. **Modelo de Usuario (SQLAlchemy)**
   ```python
   class User(Base):
       __tablename__ = "users"
       
       id = Column(Integer, primary_key=True)
       email = Column(String, unique=True, index=True)
       full_name = Column(String)
       password_hash = Column(String, nullable=True)  # Null para usuarios de Google
       firebase_uid = Column(String, unique=True, nullable=True, index=True)
       auth_provider = Column(String, default="local")  # "local" o "google"
       email_verified = Column(Boolean, default=False)
       is_active = Column(Boolean, default=True)
       profile_image = Column(String, nullable=True)
   ```

## 🗄️ Base de Datos: ¿Dónde se Guarda Qué?

### Firebase (Solo Autenticación)
```
- UID del usuario
- Email
- Nombre
- Foto de perfil
- Proveedor (Google)
- Email verificado
```

### Tu Base de Datos (PostgreSQL/MySQL)
```
- ID interno (auto-increment)
- Email
- Nombre completo
- Firebase UID (referencia)
- Password hash (null para usuarios de Google)
- Auth provider ("google" o "local")
- Email verificado
- Foto de perfil
- Fecha de creación
- Fecha de última actualización
- Roles y permisos
- Direcciones de envío
- Pedidos
- Carrito
- ... todo tu modelo de negocio
```

**Regla de Oro:** Firebase solo autentica, tu base de datos autoriza y almacena todo lo demás.

## 🔄 Sincronización de Usuarios

### Escenarios Posibles

1. **Usuario nuevo con Google**
   - Firebase: Crea usuario
   - Backend: Crea usuario en BD

2. **Usuario existente (email/password) intenta Google**
   - Firebase: Login exitoso
   - Backend: Vincula firebase_uid al usuario existente

3. **Usuario de Google intenta email/password**
   - Backend: Rechazar (no tiene password_hash)
   - Mensaje: "Esta cuenta usa Google. Por favor inicia sesión con Google"

## 🧪 Testing

### Probar en Desarrollo

1. **Login con Google**
   ```bash
   # Asegúrate de tener las variables de entorno
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   # ...
   ```

2. **Verificar Token en Backend**
   ```bash
   # Endpoint de prueba
   curl -X POST http://localhost:8000/auth/google-login \
     -H "Content-Type: application/json" \
     -d '{"firebase_token": "eyJhbGci..."}'
   ```

3. **Inspeccionar Cookies**
   ```javascript
   // En DevTools Console
   document.cookie
   ```

## 🚨 Manejo de Errores

### Frontend

```typescript
try {
  const googleAuthData = await loginWithGoogle();
  // ... resto del código
} catch (error) {
  // Errores comunes:
  // - popup-closed-by-user: Usuario cerró el popup
  // - popup-blocked: Navegador bloqueó el popup
  // - account-exists-with-different-credential: Email ya existe
  
  // Siempre cerrar sesión de Firebase en caso de error
  await signOutFirebase();
}
```

### Backend

```python
try:
    decoded_token = firebase_auth.verify_id_token(firebase_token)
except firebase_auth.InvalidIdTokenError:
    # Token inválido o expirado
    raise HTTPException(401, "Token inválido")
except firebase_auth.ExpiredIdTokenError:
    # Token expirado (más de 1 hora)
    raise HTTPException(401, "Token expirado")
```

## 📊 Métricas y Monitoreo

### Firebase Console
- Usuarios activos
- Métodos de autenticación
- Errores de autenticación

### Tu Backend
- Usuarios totales
- Usuarios por proveedor (Google vs Email)
- Tasa de conversión de registro
- Errores de validación de tokens

## 🔗 Referencias

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Python](https://firebase.google.com/docs/admin/setup)
- [Google Identity Platform](https://cloud.google.com/identity-platform)

---

**Última actualización:** 29 de noviembre de 2025
