function mapOrderRow(row) {
    const status = (row.status === 'Aceito' || row.status === 'Em separação' || row.status === 'Em separacao')
        ? 'Em Separacao'
        : row.status;

    return {
        id: row.id,
        subtotal: Number(row.subtotal || 0),
        deliveryFee: Number(row.deliveryFee || 0),
        total: Number(row.total || 0),
        status,
        stripeSessionId: row.stripeSessionId,
        stripePaymentIntentId: row.stripePaymentIntentId,
        paidAt: row.paidAt,
        trackingCode: row.trackingCode || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: row.userId ? {
            id: row.userId,
            name: row.userName,
            email: row.userEmail
        } : undefined,
        address: {
            id: row.addressId,
            title: row.addressTitle,
            cep: row.cep,
            logradouro: row.logradouro,
            numero: row.numero,
            bairro: row.bairro,
            complemento: row.complemento
        }
    };
}

function mapOrderItemRow(row) {
    const imgUrl = row.imgUrl || null;

    return {
        productId: row.productId,
        name: row.name,
        description: row.description,
        imgUrl,
        imageUrl: imgUrl,
        quantity: row.quantity,
        price: Number(row.price || 0),
        total: Number(row.price || 0) * Number(row.quantity || 0)
    };
}

module.exports = {
    mapOrderRow,
    mapOrderItemRow
};
