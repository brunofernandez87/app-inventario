import {
  obtenerHistorialGraficos,
  obtenerProyeccionesYRentabilidad,
  obtenerResumenMensual,
} from "@/service/reporte_mensual";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  LogBox,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

if (Platform.OS === "web") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const textoError = args.map(String).join(" ");
    if (
      textoError.includes("transform-origin") ||
      textoError.includes("transformOrigin") ||
      textoError.includes("onPressIn")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

LogBox.ignoreLogs([
  "Invalid DOM property `transform-origin`",
  "Unknown event handler property `onPressIn`",
]);

const tabs = ["Resumen Mensual", "Proyecciones", "Rentabilidad"];

const chartConfigBarras = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  barPercentage: 0.6,
  decimalPlaces: 0,
};

const chartConfigLineas = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  strokeWidth: 3,
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#2563eb" },
  decimalPlaces: 0,
};

export default function ReportesScreen() {
  const [tabActiva, setTabActiva] = useState("Resumen Mensual");
  const [loading, setLoading] = useState(true);

  const [datosMensuales, setDatosMensuales] = useState({
    transacciones: 0,
    unidadesVendidas: 0,
    costosTotales: 0,
    gananciaNeta: 0,
  });
  const [historialGraficos, setHistorialGraficos] = useState({
    labels: ["-"],
    ganancias: [0],
    transacciones: [0],
  });

  const [proyecciones, setProyecciones] = useState<any[]>([]);
  const [rentabilidad, setRentabilidad] = useState<any[]>([]);
  const [resumenRentabilidad, setResumenRentabilidad] = useState({
    totalCosto: 0,
    totalPrecio: 0,
    gananciaPotencial: 0,
  });

  const ID_EMPRESA_ACTUAL = 1;

  useFocusEffect(
    useCallback(() => {
      const cargarReportes = async () => {
        setLoading(true);
        const [resumen, historial, extraData] = await Promise.all([
          obtenerResumenMensual(ID_EMPRESA_ACTUAL),
          obtenerHistorialGraficos(ID_EMPRESA_ACTUAL),
          obtenerProyeccionesYRentabilidad(ID_EMPRESA_ACTUAL),
        ]);

        setDatosMensuales(resumen);
        setHistorialGraficos(historial);
        setProyecciones(extraData.proyecciones);
        setRentabilidad(extraData.rentabilidad);
        setResumenRentabilidad(extraData.resumenRentabilidad);

        setLoading(false);
      };
      cargarReportes();
    }, []),
  );

  const CardIndicador = ({ titulo, valor, subtitulo }: any) => (
    <View style={[styles.card, { flex: 1, minWidth: 140 }]}>
      <Text style={styles.cardTitulo}>{titulo}</Text>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardSub}>{subtitulo}</Text>
    </View>
  );

  const renderTabResumen = () => {
    if (loading)
      return (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 40 }}
        />
      );

    const dataGanancias = {
      labels: historialGraficos.labels,
      datasets: [
        {
          data:
            historialGraficos.ganancias.length > 0
              ? historialGraficos.ganancias
              : [0],
        },
      ],
    };

    const dataVentas = {
      labels: historialGraficos.labels,
      datasets: [
        {
          data:
            historialGraficos.transacciones.length > 0
              ? historialGraficos.transacciones
              : [0],
        },
      ],
    };

    const anchoGrafico = Platform.OS === "web" ? 400 : 320;
    const labelsInvertidos = [...historialGraficos.labels].reverse();
    const transaccionesInvertidas = [
      ...historialGraficos.transacciones,
    ].reverse();
    const gananciasInvertidas = [...historialGraficos.ganancias].reverse();

    return (
      <View style={styles.tabContent}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <CardIndicador
            titulo="VENTAS DEL MES"
            valor={datosMensuales.transacciones.toString()}
            subtitulo="transacciones"
          />
          <CardIndicador
            titulo="PRODUCTOS VENDIDOS"
            valor={datosMensuales.unidadesVendidas.toString()}
            subtitulo="unidades"
          />
          <CardIndicador
            titulo="COSTOS TOTALES"
            valor={`$ ${datosMensuales.costosTotales.toLocaleString("es-AR")}`}
            subtitulo="costo mercadería"
          />
          <CardIndicador
            titulo="GANANCIA NETA"
            valor={`$ ${datosMensuales.gananciaNeta.toLocaleString("es-AR")}`}
            subtitulo="ingresos - costos"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <View
            style={[
              styles.card,
              { flex: 1, minWidth: anchoGrafico + 40, alignItems: "center" },
            ]}
          >
            <Text style={styles.cardTituloGrafico}>
              Ganancia Neta (Últimos 6 meses)
            </Text>
            <BarChart
              data={dataGanancias}
              width={anchoGrafico}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfigBarras}
              fromZero={true}
              style={{ borderRadius: 12, marginTop: 10 }}
            />
          </View>
          <View
            style={[
              styles.card,
              { flex: 1, minWidth: anchoGrafico + 40, alignItems: "center" },
            ]}
          >
            <Text style={styles.cardTituloGrafico}>Transacciones de Venta</Text>
            <LineChart
              data={dataVentas}
              width={anchoGrafico}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" vtas"
              chartConfig={chartConfigLineas}
              bezier
              fromZero={true}
              withDots={Platform.OS !== "web"}
              style={{ borderRadius: 12, marginTop: 10 }}
            />
          </View>
        </View>

        <View style={[styles.tableCard, { marginTop: 10 }]}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Desglose Mes a Mes</Text>
            <Text style={styles.tableCardSub}>
              Historial numérico de los últimos 6 meses
            </Text>
          </View>
          <View style={styles.tablaRowHead}>
            <Text style={[styles.colHead, { flex: 1 }]}>Mes</Text>
            <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
              Transacciones
            </Text>
            <Text style={[styles.colHead, { flex: 1, textAlign: "right" }]}>
              Ingresos Totales
            </Text>
          </View>
          {labelsInvertidos.map((mes, index) => (
            <View
              key={index}
              style={[
                styles.tablaRow,
                index === labelsInvertidos.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <Text
                style={[styles.rowTxtBase, { flex: 1, fontWeight: "bold" }]}
              >
                {mes} {index === 0 && "(Actual)"}
              </Text>
              <Text
                style={[styles.rowTxtBase, { flex: 1, textAlign: "center" }]}
              >
                {transaccionesInvertidas[index]} ventas
              </Text>
              <Text
                style={[
                  styles.rowTxtBase,
                  {
                    flex: 1,
                    textAlign: "right",
                    color: "#16a34a",
                    fontWeight: "bold",
                  },
                ]}
              >
                $ {gananciasInvertidas[index].toLocaleString("es-AR")}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTabProyecciones = () => (
    <View style={styles.tabContent}>
      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Proyección por Producto</Text>
          <Text style={styles.tableCardSub}>
            Calculado en base al promedio histórico de ventas de los últimos 6
            meses
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ minWidth: "100%" }}
        >
          <View style={{ minWidth: 700, width: "100%", paddingBottom: 10 }}>
            <View style={styles.tablaRowHead}>
              <Text style={[styles.colHead, { flex: 3 }]}>Producto</Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Stock actual
              </Text>
              <Text
                style={[styles.colHead, { flex: 1.5, textAlign: "center" }]}
              >
                Prom. mensual
              </Text>
              <Text
                style={[styles.colHead, { flex: 1.5, textAlign: "center" }]}
              >
                Meses restantes
              </Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Estado
              </Text>
            </View>

            {proyecciones.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}
              >
                No hay productos registrados.
              </Text>
            ) : (
              proyecciones.map((prod, index) => (
                <View
                  key={prod.id}
                  style={[
                    styles.tablaRow,
                    index === proyecciones.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={{ flex: 3 }}>
                    <Text style={styles.rowTxtBase}>{prod.nombre}</Text>
                    <Text style={styles.rowTxtSub}>{prod.codigo}</Text>
                  </View>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1, textAlign: "center", fontWeight: "500" },
                    ]}
                  >
                    {prod.stock}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1.5, textAlign: "center", color: "#64748b" },
                    ]}
                  >
                    {prod.prom}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1.5, textAlign: "center", fontWeight: "500" },
                    ]}
                  >
                    {prod.meses}
                  </Text>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={
                        prod.estado === "OK"
                          ? styles.badgeOk
                          : prod.estado === "Bajo"
                            ? styles.badgeBajo
                            : styles.badgeSinHistorial
                      }
                    >
                      <Text
                        style={
                          prod.estado === "OK"
                            ? styles.badgeTxtOk
                            : prod.estado === "Bajo"
                              ? styles.badgeTxtBajo
                              : styles.badgeTxtSinHistorial
                        }
                      >
                        {prod.estado}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderTabRentabilidad = () => (
    <View style={styles.tabContent}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
          <Text style={styles.cardTitulo}>VALOR STOCK A COSTO</Text>
          <Text style={styles.cardValor}>
            $ {resumenRentabilidad.totalCosto.toLocaleString("es-AR")}
          </Text>
        </View>
        <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
          <Text style={styles.cardTitulo}>VALOR STOCK A PRECIO VENTA</Text>
          <Text style={styles.cardValor}>
            $ {resumenRentabilidad.totalPrecio.toLocaleString("es-AR")}
          </Text>
        </View>
        <View style={[styles.cardPotencial, { flex: 1, minWidth: 200 }]}>
          <Text style={[styles.cardTitulo, { color: "#15803d" }]}>
            GANANCIA POTENCIAL EN STOCK
          </Text>
          <Text style={[styles.cardValor, { color: "#16a34a" }]}>
            $ {resumenRentabilidad.gananciaPotencial.toLocaleString("es-AR")}
          </Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Rentabilidad por Producto</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ minWidth: "100%" }}
        >
          <View style={{ minWidth: 800, width: "100%", paddingBottom: 10 }}>
            <View style={styles.tablaRowHead}>
              <Text style={[styles.colHead, { flex: 3 }]}>Producto</Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Costo
              </Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Precio
              </Text>
              <Text
                style={[styles.colHead, { flex: 1.5, textAlign: "center" }]}
              >
                Ganancia/ud
              </Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Margen
              </Text>
              <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>
                Stock
              </Text>
              <Text style={[styles.colHead, { flex: 1.5, textAlign: "right" }]}>
                Val. costo
              </Text>
            </View>

            {rentabilidad.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}
              >
                No hay productos registrados.
              </Text>
            ) : (
              rentabilidad.map((prod, index) => (
                <View
                  key={prod.id}
                  style={[
                    styles.tablaRow,
                    index === rentabilidad.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={{ flex: 3 }}>
                    <Text style={styles.rowTxtBase}>{prod.nombre}</Text>
                    <Text style={styles.rowTxtSub}>{prod.codigoMarca}</Text>
                  </View>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    $ {prod.costo.toLocaleString("es-AR")}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1, textAlign: "center", fontWeight: "bold" },
                    ]}
                  >
                    $ {prod.precio.toLocaleString("es-AR")}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      {
                        flex: 1.5,
                        textAlign: "center",
                        color: "#16a34a",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    + $ {prod.ganancia.toLocaleString("es-AR")}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      {
                        flex: 1,
                        textAlign: "center",
                        color: "#16a34a",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {prod.margen}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1, textAlign: "center", color: "#64748b" },
                    ]}
                  >
                    {prod.stock}
                  </Text>
                  <Text
                    style={[
                      styles.rowTxtBase,
                      { flex: 1.5, textAlign: "right" },
                    ]}
                  >
                    $ {prod.valCosto.toLocaleString("es-AR")}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloPrincipal}>Reportes</Text>
        <TouchableOpacity style={styles.btnImprimirGlobal}>
          <Text style={styles.txtImprimirGlobal}>Imprimir / PDF</Text>
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
        >
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  tabActiva === tab && styles.tabButtonActive,
                ]}
                onPress={() => setTabActiva(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    tabActiva === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {tabActiva === "Resumen Mensual" && renderTabResumen()}
          {tabActiva === "Proyecciones" && renderTabProyecciones()}
          {tabActiva === "Rentabilidad" && renderTabRentabilidad()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  tituloPrincipal: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  btnImprimirGlobal: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  txtImprimirGlobal: { color: "#475569", fontWeight: "600" },
  tabsScroll: { marginBottom: 20 },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    gap: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#0f172a",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderBottomWidth: 0,
  },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#0f172a" },
  tabContent: { paddingBottom: 40 },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardPotencial: {
    backgroundColor: "#ecfdf5",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  cardTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardTituloGrafico: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  cardValor: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  cardSub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  tableCardHeader: { marginBottom: 20 },
  tableCardTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  tableCardSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  tablaRowHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  colHead: { fontSize: 12, fontWeight: "bold", color: "#64748b" },
  tablaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  rowTxtBase: { fontSize: 14, color: "#334155" },
  rowTxtSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  badgeOk: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxtOk: { color: "#047857", fontSize: 12, fontWeight: "bold" },
  badgeBajo: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxtBajo: { color: "#b45309", fontSize: 12, fontWeight: "bold" },
  badgeSinHistorial: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxtSinHistorial: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
});
