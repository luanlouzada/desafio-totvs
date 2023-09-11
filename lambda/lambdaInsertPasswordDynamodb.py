import boto3
import uuid
import json
import time
import base64

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SecurePasswords')
kms_client = boto3.client('kms')

# ARN da chave mestra de cliente (CMK) no KMS
KMS_KEY_ID = 'arn:aws:kms:us-east-2:198882899432:key/51330c40-2bbf-4428-aeb6-89be70f548ef'

def lambda_handler(event, context):
    print("Full event received:", event)
    
    # Deserializar o campo body para obter os dados
    data = json.loads(event['body'])
    
    # Obter os dados do corpo da solicitação
    password = data['password']
    views = int(data['views'])
    days = int(data['days'])
    
    # Obter o User-Agent e o IP do usuário
    user_agent = event['requestContext']['identity']['userAgent']
    ip = event['requestContext']['identity']['sourceIp']
    
    # Calcular a data de expiração em timestamp
    expiry_date = int(time.time()) + (days * 86400)  # 86400 segundos em um dia

    # Gerar um ID único para a senha
    password_id = str(uuid.uuid4())

    # Criptografar a senha usando KMS
    encrypted_password = kms_client.encrypt(
        KeyId=KMS_KEY_ID,
        Plaintext=password.encode('utf-8')
    )
    encrypted_password_blob = base64.b64encode(encrypted_password['CiphertextBlob']).decode('utf-8')

    # Inserir no DynamoDB
    table.put_item(
        Item={
            'passwordId': password_id,
            'encryptedPassword': encrypted_password_blob,
            'views': views,
            'expiryDate': expiry_date,
            'viewCount': 0,
            'userAgent': user_agent,
            'ip': ip
        }
    )

    # Retornar o ID da senha para o cliente
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        'body': json.dumps({
            'passwordId': password_id
        })
    }
