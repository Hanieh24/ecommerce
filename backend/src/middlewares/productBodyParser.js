const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const uploadsRoot = path.join(__dirname, '../../uploads');
const productUploadsRoot = path.join(uploadsRoot, 'products');
const maxMultipartSize = 5 * 1024 * 1024;

function parseHeaderParameters(headerValue) {
    return headerValue.split(';').reduce((parameters, part) => {
        const [rawKey, ...rawValue] = part.trim().split('=');

        if (!rawKey || rawValue.length === 0) {
            return parameters;
        }

        parameters[rawKey] = rawValue.join('=').replace(/^"|"$/g, '');
        return parameters;
    }, {});
}

function getFileExtension(filename, contentType) {
    const extension = path.extname(filename || '').toLowerCase();

    if (extension) {
        return extension;
    }

    if (contentType === 'image/png') {
        return '.png';
    }

    if (contentType === 'image/webp') {
        return '.webp';
    }

    if (contentType === 'image/gif') {
        return '.gif';
    }

    return '.jpg';
}

function getBoundary(contentType) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    return boundaryMatch?.[1] || boundaryMatch?.[2] || null;
}

function getMultipartBuffer(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        req.on('data', (chunk) => {
            size += chunk.length;

            if (size > maxMultipartSize) {
                reject(new Error('Arquivo maior que 5MB.'));
                req.destroy();
                return;
            }

            chunks.push(chunk);
        });

        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function saveProductImage(content, filename, contentType) {
    if (!contentType.startsWith('image/')) {
        throw new Error('A imagem do produto deve ser um arquivo de imagem.');
    }

    await fs.mkdir(productUploadsRoot, { recursive: true });

    const extension = getFileExtension(filename, contentType);
    const safeFilename = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(productUploadsRoot, safeFilename);

    await fs.writeFile(filePath, content);

    return `/uploads/products/${safeFilename}`;
}

async function parseMultipartBody(req, boundary) {
    const buffer = await getMultipartBuffer(req);
    const delimiter = Buffer.from(`--${boundary}`);
    const body = {};
    let cursor = buffer.indexOf(delimiter);

    while (cursor !== -1) {
        const nextBoundary = buffer.indexOf(delimiter, cursor + delimiter.length);

        if (nextBoundary === -1) {
            break;
        }

        let partStart = cursor + delimiter.length;

        if (buffer[partStart] === 45 && buffer[partStart + 1] === 45) {
            break;
        }

        if (buffer[partStart] === 13 && buffer[partStart + 1] === 10) {
            partStart += 2;
        }

        let partEnd = nextBoundary;

        if (buffer[partEnd - 2] === 13 && buffer[partEnd - 1] === 10) {
            partEnd -= 2;
        }

        const part = buffer.subarray(partStart, partEnd);
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));

        if (headerEnd !== -1) {
            const headersText = part.subarray(0, headerEnd).toString('utf8');
            const content = part.subarray(headerEnd + 4);
            const headers = headersText.split('\r\n').reduce((currentHeaders, line) => {
                const separator = line.indexOf(':');

                if (separator === -1) {
                    return currentHeaders;
                }

                currentHeaders[line.slice(0, separator).toLowerCase()] = line.slice(separator + 1).trim();
                return currentHeaders;
            }, {});
            const disposition = parseHeaderParameters(headers['content-disposition'] || '');
            const fieldName = disposition.name;

            if (fieldName && disposition.filename && content.length > 0) {
                body.imgUrl = await saveProductImage(
                    content,
                    disposition.filename,
                    headers['content-type'] || 'application/octet-stream'
                );
            } else if (fieldName) {
                body[fieldName] = content.toString('utf8');
            }
        }

        cursor = nextBoundary;
    }

    return body;
}

async function productBodyParser(req, res, next) {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.startsWith('multipart/form-data')) {
        return next();
    }

    const boundary = getBoundary(contentType);

    if (!boundary) {
        return res.status(400).json({
            message: 'Formulário de produto inválido.'
        });
    }

    try {
        req.body = await parseMultipartBody(req, boundary);
        next();
    } catch (error) {
        return res.status(400).json({
            message: error.message || 'Não foi possível processar a imagem do produto.'
        });
    }
}

module.exports = {
    productBodyParser,
    uploadsRoot
};
