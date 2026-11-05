import ExcelJS from "exceljs";
import { writeFile } from "node:fs/promises";

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const slots = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

const examples = {
  Lunes: [
    ["Yogur griego y avena", "200 g de yogur, 40 g de avena y arándanos"],
    ["Manzana y almendras", "1 manzana y 15 almendras"],
    ["Pollo, arroz y brócoli", "150 g de pollo, 60 g de arroz y brócoli"],
    ["Requesón con canela", "100 g de requesón y canela"],
    ["Tortilla y ensalada", "2 huevos y ensalada con aceite de oliva"],
  ],
  Martes: [
    ["Tostada integral y pavo", "2 rebanadas de pan integral y 60 g de pavo"],
    ["Yogur y nueces", "1 yogur natural y 3 nueces"],
    ["Salmón, patata y judías", "140 g de salmón, 150 g de patata y judías verdes"],
    ["Leche y plátano", "250 ml de leche y 1 plátano"],
    ["Merluza y ensalada", "150 g de merluza y ensalada"],
  ],
  Miércoles: [
    ["Avena con leche y manzana", "50 g de avena, 250 ml de leche y 1 manzana"],
    ["Zanahoria y hummus", "2 zanahorias y 40 g de hummus"],
    ["Pavo, quinoa y calabacín", "150 g de pavo, 60 g de quinoa y calabacín"],
    ["Queso fresco y pera", "80 g de queso fresco y 1 pera"],
    ["Revuelto de gambas", "2 huevos, 80 g de gambas y espinacas"],
  ],
  Jueves: [
    ["Tostada de aguacate", "2 rebanadas de pan y medio aguacate"],
    ["Naranja y yogur", "1 naranja y 1 yogur natural"],
    ["Ternera, boniato y ensalada", "140 g de ternera, 150 g de boniato y ensalada"],
    ["Bocadillo pequeño de pavo", "1 panecillo y 50 g de pavo"],
    ["Tortilla francesa y verdura", "2 huevos y verdura salteada"],
  ],
  Viernes: [
    ["Kéfir, muesli y fresas", "200 ml de kéfir, 30 g de muesli y fresas"],
    ["Fruta seca", "20 g de orejones o higos"],
    ["Pasta integral con atún", "60 g de pasta y 1 lata pequeña de atún"],
    ["Yogur y arándanos", "1 yogur y un puñado de arándanos"],
    ["Pollo al horno y ensalada", "150 g de pollo y ensalada"],
  ],
  Sábado: [
    ["Tortitas de avena", "2 tortitas de avena y 1 plátano"],
    ["Almendras", "15 almendras"],
    ["Arroz, huevo y pisto", "60 g de arroz, 1 huevo y pisto"],
    ["Leche, plátano y canela", "250 ml de leche y 1 plátano"],
    ["Pescado blanco y patata", "150 g de pescado y 150 g de patata"],
  ],
  Domingo: [
    ["Huevos revueltos y pan", "2 huevos y 1 rebanada de pan integral"],
    ["Fruta de temporada", "1 pieza de fruta"],
    ["Lentejas estofadas", "200 g de lentejas ya cocidas y verdura"],
    ["Yogur griego", "150 g de yogur griego"],
    ["Ensalada completa", "Lechuga, atún, huevo y patata"],
  ],
};

const workbook = new ExcelJS.Workbook();
workbook.creator = "Nerea Studio";

const diet = workbook.addWorksheet("Dieta");
diet.columns = [
  { header: "Día", key: "day", width: 16 },
  { header: "Comida", key: "slot", width: 16 },
  { header: "Título", key: "title", width: 34 },
  { header: "Detalle", key: "detail", width: 62 },
];
diet.getRow(1).font = { bold: true };
diet.views = [{ state: "frozen", ySplit: 1 }];
diet.autoFilter = "A1:D1";

for (const day of days) {
  examples[day].forEach((meal, index) => {
    diet.addRow([day, slots[index], meal[0], meal[1]]);
  });
}

const dayList = `"${days.join(",")}"`;
const slotList = `"${slots.join(",")}"`;
for (let row = 2; row <= 80; row += 1) {
  diet.getCell(`A${row}`).dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [dayList],
    showErrorMessage: true,
    errorTitle: "Día",
    error: "Elige un día de la lista.",
  };
  diet.getCell(`B${row}`).dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [slotList],
    showErrorMessage: true,
    errorTitle: "Comida",
    error: "Elige desayuno, almuerzo, comida, merienda o cena.",
  };
}

const help = workbook.addWorksheet("Instrucciones");
help.getColumn(1).width = 88;
help.getCell("A1").value = "Cómo rellenar la dieta";
help.getCell("A1").font = { bold: true, size: 16 };
const notes = [
  "Usa la hoja Dieta. Cada fila es una comida.",
  "Día: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado o Domingo.",
  "Comida: Desayuno, Almuerzo, Comida, Merienda o Cena.",
  "Título: el nombre del plato. Detalle: las cantidades. El detalle puede quedar vacío.",
  "Puedes poner varias filas del mismo día y la misma comida. El orden de las filas es el orden en el que las verá el cliente.",
  "Las filas de ejemplo se pueden borrar o cambiar.",
  "Al subir el archivo desde el estudio del cliente se sustituye la dieta de toda la semana.",
];
notes.forEach((note, index) => {
  help.getCell(`A${index + 3}`).value = note;
});

const buffer = await workbook.xlsx.writeBuffer();
await writeFile(new URL("../public/plantilla-dieta.xlsx", import.meta.url), Buffer.from(buffer));
console.log("plantilla-dieta.xlsx");
