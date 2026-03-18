'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Inspection, Tenant, Property, Landlord, Client } from '@/types';

// Register fonts if needed
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
        marginBottom: 20,
    },
    logo: {
        width: 60,
        height: 60,
        backgroundColor: '#f4f4f4',
    },
    agencyInfo: {
        textAlign: 'right',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa',
        padding: 5,
        marginTop: 15,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#007bff',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        paddingVertical: 5,
    },
    itemLabel: {
        width: '40%',
        fontWeight: 'bold',
    },
    itemStatus: {
        width: '15%',
    },
    itemNote: {
        width: '45%',
        color: '#666',
    },
    photoContainer: {
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoBox: {
        width: '48%',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 5,
    },
    photo: {
        width: '100%',
        height: 120,
        backgroundColor: '#eee',
    },
    photoLabel: {
        fontSize: 8,
        marginTop: 5,
        textAlign: 'center',
        color: '#888',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#aaa',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    signatures: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    signatureBox: {
        width: '40%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    signatureCpf: {
        fontSize: 8,
        color: '#555',
    }
});

interface Props {
    inspection: Inspection;
    tenant: Tenant;
    property?: Property | null;
    landlord?: Landlord | null;
    client?: Client | null;
}

export const InspectionPDF = ({ inspection, tenant, property, landlord, client }: Props) => {
    // Collect all photos for the annex
    const annexPhotos: { src: string | null; label: string; ref?: string; isGeneral?: boolean }[] = [];

    inspection.environments.forEach(env => {
        // Add general photos
        if (env.generalPhotos && env.generalPhotos.length > 0) {
            env.generalPhotos.forEach((photo, idx) => {
                annexPhotos.push({
                    src: photo,
                    label: `${env.name} - Foto Geral ${idx + 1}`,
                    isGeneral: true
                });
            });
        }

        // Add item photos (all items that have a photo)
        env.items.forEach(item => {
            if (item.photo) {
                annexPhotos.push({
                    src: item.photo,
                    label: `${env.name} - ${item.name}`,
                    ref: item.status === 'not_ok' ? `${item.defect}` : 'Estado OK'
                });
            }
        });
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Relatório de Vistoria</Text>
                        <Text>Data: {inspection.date}</Text>
                        <Text>Tipo: {inspection.type === 'entry' ? 'Entrada' : 'Saída'}</Text>
                    </View>
                    <View style={styles.agencyInfo}>
                        <Text style={{ fontWeight: 'bold' }}>{tenant.name}</Text>
                        <Text>CNPJ: {tenant.cnpj}</Text>
                        <Text>{tenant.address}</Text>
                    </View>
                </View>

                {/* Main Information Section */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.sectionTitle}>Informações Principais da Vistoria</Text>
                    <View style={styles.row}>
                        <Text style={styles.itemLabel}>Endereço do Imóvel</Text>
                        <Text style={styles.itemNote}>{property?.address || 'Não informado'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.itemLabel}>Locador(a)</Text>
                        <Text style={styles.itemNote}>{landlord?.name || 'Não informado'} {landlord?.cpf ? `(CPF: ${landlord.cpf})` : ''}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.itemLabel}>Locatário(a)</Text>
                        <Text style={styles.itemNote}>{client?.name || 'Não informado'} {client?.cpf ? `(CPF: ${client.cpf})` : ''}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.itemLabel}>Data e Tipo</Text>
                        <Text style={styles.itemNote}>{inspection.date} - {inspection.type === 'entry' ? 'Entrada' : 'Saída'}</Text>
                    </View>
                </View>

                {/* Meters Section */}
                {inspection.meters && (
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Leitura de Medidores</Text>
                        <View style={styles.row}>
                            <Text style={styles.itemLabel}>Energia (Luz)</Text>
                            <Text style={styles.itemNote}>{inspection.meters.light || 'Não informada'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.itemLabel}>Água</Text>
                            <Text style={styles.itemNote}>{inspection.meters.water || 'Não informada'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.itemLabel}>Gás</Text>
                            <Text style={styles.itemNote}>{inspection.meters.gas || 'Não informada'}</Text>
                        </View>
                    </View>
                )}

                {/* Keys Section */}
                {inspection.keys && inspection.keys.length > 0 && (
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Controle de Chaves</Text>
                        {inspection.keys.map((key, idx) => (
                            <View key={idx} style={styles.row}>
                                <Text style={styles.itemLabel}>{key.description}</Text>
                                <Text style={styles.itemNote}>{key.quantity} Unidade(s)</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Agreement Section */}
                {inspection.agreementTerm && (
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Termo de Aceite do Laudo</Text>
                        <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#555', padding: 5 }}>
                            "{inspection.agreementTerm}"
                        </Text>
                    </View>
                )}

                {/* Inspection List */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Itens da Vistoria</Text>
                    {inspection.environments.map((env) => (
                        <View key={env.id} wrap={false} style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, backgroundColor: '#f0f0f0', padding: 4 }}>{env.name}</Text>
                            {env.items.filter(i => i.status !== 'pending').map((item) => (
                                <View key={item.id} style={styles.row}>
                                    <Text style={styles.itemLabel}>{item.name}</Text>
                                    <Text style={[styles.itemStatus, { color: item.status === 'ok' ? '#28a745' : '#dc3545' }]}>
                                        {item.status === 'ok' ? 'OK' : 'AVARIA'}
                                    </Text>
                                    <Text style={styles.itemNote}>
                                        {item.status === 'not_ok' ? `${item.observation || item.defect}` : (item.photo ? '(Com foto)' : '-')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <Text style={styles.footer} fixed>
                    Este documento é parte integrante do contrato de locação. Gerado por Vistorify em {new Date().toLocaleDateString('pt-BR')}.
                </Text>
            </Page>

            {/* Annex & Signatures Page */}
            <Page size="A4" style={styles.page}>
                {annexPhotos.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Anexo Fotográfico Completo</Text>
                        <View style={styles.photoContainer}>
                            {annexPhotos.map((photo, idx) => (
                                <View key={idx} style={styles.photoBox} wrap={false}>
                                    <Text style={styles.photoLabel}>{photo.label}</Text>
                                    {photo.src ? (
                                        <Image src={photo.src} style={[styles.photo, { objectFit: 'contain' }]} />
                                    ) : (
                                        <View style={[styles.photo, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ fontSize: 8 }}>Erro ao carregar imagem</Text>
                                        </View>
                                    )}
                                    {photo.ref && <Text style={{ fontSize: 6, textAlign: 'center', marginTop: 2 }}>Obs: {photo.ref}</Text>}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Signatures */}
                <View style={styles.signatures} wrap={false}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{landlord?.name || 'Locador(a)'}</Text>
                        <Text style={styles.signatureCpf}>CPF: {landlord?.cpf || 'Não informado'}</Text>
                        <Text style={{ fontSize: 8, marginTop: 2, color: '#888' }}>Locador(a)</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{client?.name || 'Locatário(a)'}</Text>
                        <Text style={styles.signatureCpf}>CPF: {client?.cpf || 'Não informado'}</Text>
                        <Text style={{ fontSize: 8, marginTop: 2, color: '#888' }}>Locatário(a)</Text>
                    </View>
                </View>

                <Text style={styles.footer} fixed>
                    Este documento é parte integrante do contrato de locação. Gerado por Vistorify em {new Date().toLocaleDateString('pt-BR')}.
                </Text>
            </Page>
        </Document>
    );
};
