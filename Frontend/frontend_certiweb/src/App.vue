<script>
import { isConnected, getUserInfo, signTransaction } from "@stellar/freighter-api";
import { Contract, Server, TransactionBuilder, Networks, BASE_FEE } from "soroban-client";

export default {
  name: 'App',
  data() {
    return {
      walletConnected: false,
      publicKey: '',
      localId: '',
      localName: '',
      localAddress: '',
      serviceId: '',
      serviceName: '',
      serviceDescription: '',
      contractId: 'CAX2TPLPGSAVFNSCEHBJYEYQTBZ7KW2DPULPZXJNIEV7YQ6445EQX7JQ',
      networkPassphrase: 'Test SDF Network ; September 2015',
      server: new Server('https://rpc-futurenet.stellar.org')
    };
  },
  methods: {
    async connectFreighter() {
      try {
        const { publicKey } = await getUserInfo();
        this.walletConnected = true;
        this.publicKey = publicKey;
      } catch (error) {
        alert("Error al conectar con Freighter.");
      }
    },
    async registrarLocal() {
      // Lógica para registrar un local
    },
    async registrarServicio() {
      // Lógica para registrar un servicio
    },
    async asignarServicio() {
      // Lógica para asignar un servicio a un local
    }
  }
};
</script>

<template>
  <div>
    <button @click="connectFreighter">Conectar Wallet</button>
    <div v-if="walletConnected">
      <h2>Registrar Local</h2>
      <input v-model="localId" placeholder="ID Local" />
      <input v-model="localName" placeholder="Nombre Local" />
      <input v-model="localAddress" placeholder="Dirección Local" />
      <button @click="registrarLocal">Registrar Local</button>

      <h2>Registrar Servicio</h2>
      <input v-model="serviceId" placeholder="ID Servicio" />
      <input v-model="serviceName" placeholder="Nombre Servicio" />
      <input v-model="serviceDescription" placeholder="Descripción Servicio" />
      <button @click="registrarServicio">Registrar Servicio</button>

      <h2>Asignar Servicio a Local</h2>
      <input v-model="localId" placeholder="ID Local" />
      <input v-model="serviceId" placeholder="ID Servicio" />
      <button @click="asignarServicio">Asignar Servicio</button>
    </div>
  </div>
</template>