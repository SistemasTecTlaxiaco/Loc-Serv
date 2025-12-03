import { invoke } from './soroban';
import * as StellarSdk from '@stellar/stellar-sdk';

const { nativeToScVal } = StellarSdk;

export async function createUser(id: string, nombre: string, ag_patemo: string, ag_matemo: string, correo: string, direccion: number) {
  return invoke({
    method: 'crear_usuario',
    args: [
      nativeToScVal(id, { type: 'string' }),
      nativeToScVal(nombre, { type: 'string' }),
      nativeToScVal(ag_patemo, { type: 'string' }),
      nativeToScVal(ag_matemo, { type: 'string' }),
      nativeToScVal(correo, { type: 'string' }),
      nativeToScVal(direccion, { type: 'i32' }),
    ],
    signAndSend: true,
  });
}

export async function createService(id: string, nombre: string, categoria: string, descripcion: string, disponibilidad: number, precio: number) {
  return invoke({
    method: 'crear_servicio',
    args: [
      nativeToScVal(id, { type: 'string' }),
      nativeToScVal(nombre, { type: 'string' }),
      nativeToScVal(categoria, { type: 'string' }),
      nativeToScVal(descripcion, { type: 'string' }),
      nativeToScVal(BigInt(disponibilidad), { type: 'i128' }),
      nativeToScVal(BigInt(precio), { type: 'i128' }),
    ],
    signAndSend: true,
  });
}

export async function createContract(id: string, id_servicio: string, id_usuario: string, fecha_inicio: string, fecha_fin: string, monto: number) {
  return invoke({
    method: 'crear_contrato',
    args: [
      nativeToScVal(id, { type: 'string' }),
      nativeToScVal(id_servicio, { type: 'string' }),
      nativeToScVal(id_usuario, { type: 'string' }),
      nativeToScVal(fecha_inicio, { type: 'string' }),
      nativeToScVal(fecha_fin, { type: 'string' }),
      nativeToScVal(BigInt(monto), { type: 'i128' }),
    ],
    signAndSend: true,
  });
}

export async function getContract(id: string) {
  // TODO: Implement read-only call
  return null;
}
