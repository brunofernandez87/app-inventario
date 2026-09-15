import { Empresa } from "@/types/types";
import { imprimirPDF } from "@/utils/impresora";

const fecha = new Date().toLocaleDateString("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
export const imprimirPresupuesto = async (
  lista: any,
  empresa: Empresa,
  cliente: string,
  totalFinal: number,
  descuento_admin: number,
) => {
  const filasHTML = lista
    .map((item) => {
      const codigo = item.producto.codigo_alfanumerico;
      const producto = item.producto.nombre_producto;
      const cantidad = Number(item.cantidad) || 0;
      const medida = item.producto.medida.nombre_tipo;
      const paquete_cerrado = item.es_paquete_cerrado
        ? "Paquete cerrado"
        : "Suelto";
      const descuento = item.es_paquete_cerrado
        ? item.bonificacion_paquete
        : "No";
      const precio = Number(item.precio_unitario);
      const subtotal = Number(item.subtotal);
      return `
              <tr>
              <td>${codigo} </td>
          <td>${producto || "-"}</td>
          <td>${cantidad || "-"}</td>
          <td>${medida} </td>
            <td>${paquete_cerrado}</td>
            <td> ${descuento} </td>
      <td>$${precio.toFixed(2)}</td>
            <td>$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
  const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: auto; margin: 10mm; } 
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #1e293b; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
              th { background-color: #2563eb; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f8fafc; }
              tfoot td { font-weight: bold; background-color: #e2e8f0 !important; color: #1e293b; font-size: 14px; }
              .total-label { text-align: right; font-weight: bold;}
              .fila-descuento td { background-color: #ffffff !important; color: #dc2626; font-weight: 600; border-top: 2px solid #cbd5e1; }
              .fila-total td { background-color: #e2e8f0 !important; color: #1e293b; font-weight: bold; font-size: 14px; }
              .cliente-info { font-size: 14px; font-weight: bold; color: #334155; text-align: right; }
            </style>
          </head>
          <body>
            <h1>Presupuesto</h1>
            <h2> ${empresa?.nombre_empresa} </h2>
            <h3> ${fecha} </h3>
            <table>
              <thead>
                <tr>
                <th>Codigo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Tipo</th>
                  <th>Paquete</th>
                  <th> Descuento</th>
                  <th>precio</th>
                  <th>subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
                <tfoot>
                      <tr class="fila-descuento"> 
                      <td colspan="7" class="total-label"> descuento por dueño:</td> 
                      <td>- $${descuento_admin.toFixed(2)}</td>
                      </tr>
                <tr class="fila-total">
                  <td colspan="7" class="total-label">TOTAL:</td>
                  <td>$${totalFinal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div class="cliente-info">Cliente: ${cliente}</div>
          </body>
        </html>
      `;
  await imprimirPDF(htmlContent);
  return true;
};
