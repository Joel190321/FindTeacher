## 📖 Descripción

**FindTeacher** es una plataforma social diseñada específicamente para estudiantes universitarios que desean tomar decisiones informadas al momento de inscribir sus materias. Inspirada en la experiencia de usuario de Instagram, FindTeacher permite a los estudiantes:

- 📝 Publicar reseñas detalladas de profesores y materias
- ⭐ Calificar profesores del 1 al 5 estrellas
- 💬 Comentar y discutir sobre las experiencias de otros estudiantes
- 🔍 Buscar profesores por código de materia, nombre de curso o nombre del profesor
- 🎯 Filtrar por carrera y calificación
- 💾 Guardar posts favoritos para consultar después
- 🔗 Compartir reseñas con otros estudiantes

La aplicación surgió de la necesidad de tener una herramienta moderna y accesible que reemplace los antiguos sistemas de búsqueda por matrícula, ofreciendo una experiencia más social, interactiva y útil para la comunidad estudiantil.

---

## ✨ Características

### 🔐 Autenticación
- Inicio de sesión con Google
- Perfiles de usuario con foto y estadísticas
- Sesiones persistentes

### 📱 Interfaz Moderna
- Diseño oscuro inspirado en redes sociales modernas
- Animaciones suaves y transiciones fluidas
- Responsive design (móvil, tablet, desktop)
- Componentes estilo Instagram

### 📝 Sistema de Reseñas
- Publicar reseñas con código de materia, nombre, profesor y calificación
- Sistema de estrellas (1-5) para calificar profesores
- Validación de contenido (mínimo 50 caracteres)
- Filtrado por carrera universitaria

### 💬 Comentarios en Tiempo Real
- Sistema de comentarios estilo Instagram
- Respuestas anidadas a comentarios
- Likes en comentarios
- Indicador "by author" para el creador del post
- Modal deslizable con gestos (swipe down to close)
- Reacciones rápidas con emojis

### 🔍 Búsqueda y Filtros
- Búsqueda en tiempo real con debounce
- Filtros por calificación (1-5 estrellas)
- Filtros por carrera universitaria
- Búsqueda por código, materia o profesor

### 💾 Guardados
- Guardar posts favoritos
- Página dedicada de posts guardados en el perfil
- Sincronización en tiempo real

### 🔗 Compartir
- Botón de compartir con Web Share API
- Copiar link directo al post
- Links únicos para cada publicación

### 📊 Perfil de Usuario
- Estadísticas personales (posts, comentarios, likes recibidos)
- Tabs para ver: Mis Posts, Mis Comentarios, Posts Guardados
- Ordenamiento automático por fecha

### ⚡ Optimizaciones
- Queries optimizadas con límites
- Memoización de componentes con React.memo
- Debounce en búsquedas
- Lazy loading de componentes
- Actualizaciones en tiempo real con Firestore

---

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** - Framework de React con App Router
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **shadcn/ui** - Componentes de UI accesibles

### Backend & Database
- **Firebase Authentication** - Autenticación con Google
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Hosting y deployment

### Herramientas
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas
- **ESLint** - Linting de código

---

## 🚀 Instalación

### Prerequisitos
- Node.js 18+ instalado
- Cuenta de Firebase
- Git

### Pasos

1. **Clonar el repositorio**
\`\`\`bash
git clone https://github.com/Joel190321/findteacher.git
cd findteacher
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
\`\`\`

4. **Configurar Firebase**

- Ve a [Firebase Console](https://console.firebase.google.com/)
- Crea un nuevo proyecto
- Habilita Authentication con Google
- Crea una base de datos Firestore
- Copia las credenciales al archivo `.env.local`

5. **Ejecutar en desarrollo**
\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📚 Uso

### Crear una Reseña

1. Inicia sesión con tu cuenta de Google
2. Haz clic en "Crear Reseña" en el header
3. Completa el formulario:
   - Código de materia (ej: MAT101)
   - Nombre de la materia
   - Nombre del profesor
   - Selecciona tu carrera
   - Califica con estrellas (1-5)
   - Escribe tu reseña (mínimo 50 caracteres)
4. Haz clic en "Publicar Reseña"

### Buscar Profesores

1. Ve a la página "Explorar"
2. Usa la barra de búsqueda para buscar por:
   - Código de materia
   - Nombre de materia
   - Nombre de profesor
3. Aplica filtros por:
   - Carrera universitaria
   - Calificación (1-5 estrellas)

### Interactuar con Posts

- **Like**: Haz clic en el corazón
- **Comentar**: Haz clic en el ícono de comentarios
- **Guardar**: Haz clic en el ícono de bookmark
- **Compartir**: Haz clic en el ícono de compartir

### Ver tu Perfil

1. Haz clic en tu foto de perfil en el header
2. Selecciona "Perfil"
3. Navega entre las tabs:
   - **Mis Posts**: Todas tus reseñas
   - **Mis Comentarios**: Todos tus comentarios
   - **Guardados**: Posts que has guardado

---

## 🗄️ Estructura del Proyecto

\`\`\`
findteacher/
├── app/
│   ├── create/          # Página de crear reseña
│   ├── explore/         # Página de exploración
│   ├── post/[id]/       # Página de detalle de post
│   ├── profile/         # Página de perfil
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Página de inicio
│   └── globals.css      # Estilos globales
├── components/
│   ├── ui/              # Componentes de shadcn/ui
│   ├── header.tsx       # Header de navegación
│   ├── hero.tsx         # Hero section
│   ├── post-card.tsx    # Card de post
│   ├── instagram-comments.tsx  # Sistema de comentarios
│   ├── footer.tsx       # Footer
│   └── ...
├── lib/
│   ├── firebase.ts      # Configuración de Firebase
│   ├── auth-context.tsx # Context de autenticación
│   └── utils.ts         # Utilidades
├── public/              # Archivos estáticos
└── ...
\`\`\`

---

## 🔒 Reglas de Seguridad de Firestore

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
      allow update: if isSignedIn();
      allow delete: if isOwner(resource.data.authorId);
    }
    
    match /comments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
      allow update: if isOwner(resource.data.authorId);
      allow delete: if isOwner(resource.data.authorId);
    }
    
    match /users/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }
  }
}
\`\`\`

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Si quieres contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

- [ ] Sistema de notificaciones en tiempo real
- [ ] Rankings de mejores profesores
- [ ] Estadísticas y gráficos
- [ ] Sistema de reportes y moderación
- [ ] Modo claro/oscuro toggle
- [ ] Paginación infinita
- [ ] PWA (Progressive Web App)
- [ ] Verificación de estudiantes

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Joel Rodríguez**

- GitHub: [@Joel190321](https://github.com/Joel190321)
- Proyecto: [FindTeacher](https://github.com/Joel190321/findteacher)

---

## 🙏 Agradecimientos

- Inspirado en la necesidad de mejorar la experiencia de inscripción de materias universitarias
- Diseño inspirado en Instagram y plataformas sociales modernas
- Construido con las mejores prácticas de Next.js y React

---
