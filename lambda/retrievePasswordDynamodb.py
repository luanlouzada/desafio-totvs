import boto3
import json
import time
import base64
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SecurePasswords')
kms_client = boto3.client('kms')

# ARN da chave mestra de cliente (CMK) no KMS
KMS_KEY_ID = 'arn:aws:kms:us-east-2:198882899432:key/51330c40-2bbf-4428-aeb6-89be70f548ef'

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    password_id = event['queryStringParameters']['pass']

    # Recuperar o item do DynamoDB usando o passwordId
    response = table.get_item(
        Key={
            'passwordId': password_id
        }
    )

    item = response.get('Item')
    if not item:
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True
            },
            'body': json.dumps({'message': 'Senha não encontrada'})
        }

    # Verificar se a senha expirou
    current_time = int(time.time())
    if current_time > item['expiryDate']:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True
            },
            'body': json.dumps({'message': 'Senha expirada'})
        }

    # Se esta é a última visualização permitida, retorne a senha e depois apague o item
    if item['viewCount'] == item['views']:
        # Descriptografar a senha usando o KMS
        decrypted_password = kms_client.decrypt(
            KeyId=KMS_KEY_ID,
            CiphertextBlob=base64.b64decode(item['encryptedPassword'])
        )['Plaintext'].decode('utf-8')
        
        # Apagar o item do banco de dados
        table.delete_item(Key={'passwordId': password_id})

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True
            },
            'body': json.dumps({
                'password': decrypted_password,
                'expiryDate': item['expiryDate'],  # Retorne o timestamp de expiração
                'viewsRemaining': 0  # Não há visualizações restantes
            }, cls=DecimalEncoder)
        }

    # Atualizar o contador de visualizações
    table.update_item(
        Key={
            'passwordId': password_id
        },
        UpdateExpression='SET viewCount = viewCount + :val',
        ExpressionAttributeValues={
            ':val': 1
        }
    )

    # Descriptografar a senha usando o KMS
    decrypted_password = kms_client.decrypt(
        KeyId=KMS_KEY_ID,
        CiphertextBlob=base64.b64decode(item['encryptedPassword'])
    )['Plaintext'].decode('utf-8')

    # Retornar a senha descriptografada para o cliente
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        },
        'body': json.dumps({
            'password': decrypted_password,
            'expiryDate': item['expiryDate'],  # Retorne o timestamp de expiração
            'viewsRemaining': item['views'] - item['viewCount']  # Não subtraia mais 1 aqui
        }, cls=DecimalEncoder)
    }

