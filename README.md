# Nerea Studio

Web para que Nerea prepare dietas y entrenos, y cada cliente vea el suyo.

## Puesta en marcha

1. Copia `.env.example` a `.env.local`.
2. Crea un proyecto en Supabase y pega la URL, la clave publicable y la clave secret.
3. En `ADMIN_EMAILS` pon el correo con el que entrará Nerea. Esa cuenta ve a todos los clientes.
4. En el SQL editor de Supabase, ejecuta `supabase/migrations/20261104140000_nerea_studio.sql`.
5. En Authentication, añade `http://localhost:3000/auth/callback` como URL de redirección.
6. `npm run dev` y abre http://localhost:3000.

Nerea se registra con su correo. El resto de cuentas son clientes: al entrar rellenan la ficha corporal (peso, altura, pecho, brazo, cintura, cadera y muslo) y después ven la dieta por días y el entreno con los pesos.

La dieta se organiza en desayuno, almuerzo, comida, merienda y cena. Los días van de lunes a domingo.
