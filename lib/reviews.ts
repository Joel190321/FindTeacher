export const FACULTIES = [
  {
    name: "Facultad de Arquitectura e Ingenierías",
    careers: [
      "Arquitectura",
      "Ingeniería Civil",
      "Ingeniería Eléctrica",
      "Ingeniería Electrónica",
      "Ingeniería Industrial",
      "Ingeniería Mecánica",
      "Ingeniería en Sistemas Computacionales",
    ],
  },
  {
    name: "Facultad de Ciencias de la Salud",
    careers: [
      "Medicina",
      "Odontología",
      "Enfermería",
      "Bioanálisis",
      "Fármaco-Bioquímica",
      "Psicología (clínica, industrial y educativa)",
      "Optometría",
      "Nutrición Humana y Dietética",
      "Veterinaria y Zootecnia",
    ],
  },
  {
    name: "Facultad de Ciencias Económicas y Sociales",
    careers: [
      "Administración de Empresas",
      "Administración de Empresas Turísticas y Hoteleras",
      "Contaduría Pública",
      "Mercadeo",
      "Economía",
    ],
  },
  {
    name: "Facultad de Ciencias y Humanidades",
    careers: [
      "Derecho",
      "Comunicación Social",
      "Educación (con diversas menciones: Inicial, Básica, Lenguas Modernas, Matemáticas y Física, Ciencias Naturales, Ciencias Sociales, Educación Física)",
      "Administración de Oficinas / Ciencias Secretariales",
    ],
  },
] as const

export const CAREERS = FACULTIES.flatMap((faculty) => faculty.careers)

export const RATING_CATEGORIES = [
  { key: "clarity", label: "Claridad", description: "Explica los temas de forma comprensible" },
  { key: "methodology", label: "Metodología", description: "Usa actividades y recursos útiles" },
  { key: "fairness", label: "Evaluación justa", description: "Evalúa de acuerdo con lo impartido" },
  { key: "punctuality", label: "Puntualidad", description: "Cumple horarios y fechas" },
] as const

export type RatingCategory = (typeof RATING_CATEGORIES)[number]["key"]
export type CategoryRatings = Record<RatingCategory, number>

export interface ReviewPost {
  id: string
  courseCode: string
  courseName: string
  professorName: string
  professorSlug?: string
  career?: string
  academicTerm?: string
  rating: number
  ratings?: Partial<CategoryRatings>
  difficulty?: number
  review: string
  authorId?: string
  authorName: string
  authorPhoto: string
  createdAt: string
  likes: number
  likedBy?: string[]
  commentsCount: number
  savedBy?: string[]
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function toProfessorSlug(name: string) {
  return normalizeText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildReviewId(userId: string, professorName: string, courseCode: string, academicTerm: string) {
  const professor = toProfessorSlug(professorName) || "profesor"
  const course = normalizeText(courseCode).replace(/[^a-z0-9]+/g, "-") || "materia"
  const term = normalizeText(academicTerm).replace(/[^a-z0-9]+/g, "-") || "periodo"
  return `${userId}_${professor}_${course}_${term}`
}

export function averageRatings(ratings: Partial<CategoryRatings>) {
  const values = RATING_CATEGORIES.map(({ key }) => ratings[key] || 0).filter(Boolean)
  if (!values.length) return 0
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1))
}

export function getRatingValue(post: ReviewPost, category: RatingCategory) {
  return post.ratings?.[category] || post.rating || 0
}
