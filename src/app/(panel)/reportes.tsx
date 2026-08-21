import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// === MOCK DATA ===
const mockProyecciones = [
  {
    id: 1,
    nombre: "Cable Eléctrico 4mm",
    codigo: "CAB-002",
    stock: 120,
    prom: "~20/mes",
    meses: "6 meses",
    estado: "OK",
  },
  {
    id: 2,
    nombre: "Pintura Látex Interior Blanca 4L",
    codigo: "PIN-001",
    stock: 48,
    prom: "~6/mes",
    meses: "8 meses",
    estado: "OK",
  },
  {
    id: 3,
    nombre: "Adhesivo Cerámico Weber 30kg",
    codigo: "ADH-001",
    stock: 18,
    prom: "~2/mes",
    meses: "9 meses",
    estado: "OK",
  },
  {
    id: 4,
    nombre: "Cable Eléctrico 6mm",
    codigo: "CAB-003",
    stock: 300,
    prom: "Sin ventas",
    meses: "-",
    estado: "Sin historial",
  },
];

const mockRentabilidad = [
  {
    id: 1,
    nombre: "Cinta Aisladora 19mm x 10m",
    codigoMarca: "CIN-001 · 3M",
    costo: 180,
    precio: 280,
    ganancia: "+ $ 100",
    margen: "56%",
    stock: 240,
    valCosto: "43.200",
  },
  {
    id: 2,
    nombre: "Cable Eléctrico 2.5mm",
    codigoMarca: "CAB-001 · Prysmian",
    costo: 420,
    precio: 650,
    ganancia: "+ $ 230",
    margen: "55%",
    stock: 850,
    valCosto: "357.000",
  },
  {
    id: 3,
    nombre: "Caño Conduit 32mm x 3m",
    codigoMarca: "CAN-002 · Bticino",
    costo: 420,
    precio: 640,
    ganancia: "+ $ 220",
    margen: "52%",
    stock: 30,
    valCosto: "12.600",
  },
];

// Pestañas definitivas (chau Revendedores y Lista de Precios)
const tabs = ["Resumen Mensual", "Proyecciones", "Rentabilidad"];

export default function ReportesScreen() {
  const [tabActiva, setTabActiva] = useState("Resumen Mensual");

  // === COMPONENTES REUTILIZABLES ===
  const CardIndicador = ({ titulo, valor, subtitulo }: any) => (
    <View style={[styles.card, { flex: 1, minWidth: 140 }]}>
      <Text style={styles.cardTitulo}>{titulo}</Text>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardSub}>{subtitulo}</Text>
    </View>
  );

  // === RENDER DE PESTAÑAS ===
  const renderTabResumen = () => (
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
          valor="12"
          subtitulo="transacciones"
        />
        <CardIndicador
          titulo="PRODUCTOS VENDIDOS"
          valor="98"
          subtitulo="unidades"
        />
        <CardIndicador
          titulo="COSTOS TOTALES"
          valor="$ 121.000"
          subtitulo="en compras"
        />
        <CardIndicador
          titulo="GANANCIA NETA"
          valor="$ 64.000"
          subtitulo="~65% vs mes ant."
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
            {
              flex: 1,
              minWidth: 280,
              height: 300,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ color: "#94a3b8", fontSize: 16 }}>
            Gráfico de Barras (Ganancia Neta)
          </Text>
        </View>
        <View
          style={[
            styles.card,
            {
              flex: 1,
              minWidth: 280,
              height: 300,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ color: "#94a3b8", fontSize: 16 }}>
            Gráfico de Líneas (Ventas)
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabProyecciones = () => (
    <View style={styles.tabContent}>
      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Proyección por Producto</Text>
          <Text style={styles.tableCardSub}>
            Calculado en base al promedio histórico de ventas
          </Text>
        </View>

        {/* SOLUCIÓN RESPONSIVE: contentContainerStyle con minWidth 100% y el View con width 100% */}
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

            {mockProyecciones.map((prod, index) => (
              <View
                key={prod.id}
                style={[
                  styles.tablaRow,
                  index === mockProyecciones.length - 1 && {
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
                        : styles.badgeSinHistorial
                    }
                  >
                    <Text
                      style={
                        prod.estado === "OK"
                          ? styles.badgeTxtOk
                          : styles.badgeTxtSinHistorial
                      }
                    >
                      {prod.estado}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
          <Text style={styles.cardValor}>$ 1.596.300</Text>
        </View>
        <View style={[styles.card, { flex: 1, minWidth: 200 }]}>
          <Text style={styles.cardTitulo}>VALOR STOCK A PRECIO VENTA</Text>
          <Text style={styles.cardValor}>$ 2.415.300</Text>
        </View>
        <View style={[styles.cardPotencial, { flex: 1, minWidth: 200 }]}>
          <Text style={[styles.cardTitulo, { color: "#15803d" }]}>
            GANANCIA POTENCIAL EN STOCK
          </Text>
          <Text style={[styles.cardValor, { color: "#16a34a" }]}>
            $ 819.000
          </Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Rentabilidad por Producto</Text>
        </View>

        {/* SOLUCIÓN RESPONSIVE */}
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

            {mockRentabilidad.map((prod, index) => (
              <View
                key={prod.id}
                style={[
                  styles.tablaRow,
                  index === mockRentabilidad.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={{ flex: 3 }}>
                  <Text style={styles.rowTxtBase}>{prod.nombre}</Text>
                  <Text style={styles.rowTxtSub}>{prod.codigoMarca}</Text>
                </View>
                <Text
                  style={[styles.rowTxtBase, { flex: 1, textAlign: "center" }]}
                >
                  $ {prod.costo}
                </Text>
                <Text
                  style={[
                    styles.rowTxtBase,
                    { flex: 1, textAlign: "center", fontWeight: "bold" },
                  ]}
                >
                  $ {prod.precio}
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
                  {prod.ganancia}
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
                  style={[styles.rowTxtBase, { flex: 1.5, textAlign: "right" }]}
                >
                  $ {prod.valCosto}
                </Text>
              </View>
            ))}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {tabActiva === "Resumen Mensual" && renderTabResumen()}
        {tabActiva === "Proyecciones" && renderTabProyecciones()}
        {tabActiva === "Rentabilidad" && renderTabRentabilidad()}
      </ScrollView>
    </View>
  );
}

// === ESTILOS ===
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
  badgeSinHistorial: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTxtSinHistorial: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" },
});
