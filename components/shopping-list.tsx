import { PrintButton } from "@/components/print-button";
import { shoppingList, type ShopLine } from "@/lib/shopping";
import type { Meal } from "@/lib/types";

const GROUPS = [
  { id: "peso", label: "Por peso" },
  { id: "volumen", label: "Por volumen" },
  { id: "unidades", label: "Por unidades" },
] as const;

function ShopCards({ items }: { items: ShopLine[] }) {
  return (
    <div className="shop-groups">
      {GROUPS.map((group) => {
        const lines = items.filter((item) => item.group === group.id);
        if (lines.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`compra-${group.id}`}>
            <h2 id={`compra-${group.id}`}>{group.label}</h2>
            <ul className="shop-grid">
              {lines.map((item) => (
                <li key={`${item.group}-${item.name}`}>
                  <strong className={item.unit ? undefined : "shop-mixed"}>
                    {item.amount}
                    {item.unit ? <span>{item.unit}</span> : null}
                  </strong>
                  <p>{item.name}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function ShoppingList({ title, meals }: { title: string; meals: Meal[] }) {
  const items = shoppingList(meals);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Semana</p>
          <h1 className="page-title">Lista de la compra</h1>
        </div>
        {items.length > 0 ? <PrintButton label="Imprimir" mode="lista" /> : null}
      </header>
      {items.length === 0 ? (
        <p className="empty-state">Cuando haya comidas en la semana, la lista se rellena sola.</p>
      ) : (
        <div className="shop-screen">
          <ShopCards items={items} />
        </div>
      )}
      {items.length > 0 ? (
        <section className="shop-sheet" aria-hidden="true">
          <h1>{title}</h1>
          <table className="shop-table">
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.group}-${item.name}`}>
                  <td>{item.name}</td>
                  <td>
                    {item.unit ? `${item.amount} ${item.unit}` : item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
