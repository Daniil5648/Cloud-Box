import logging
import os
import random
import secrets
import smtplib
import string
import datetime
import json

import bcrypt
from flask import Flask, render_template, jsonify, request, make_response, send_file, Response
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename


logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler("logging.log", encoding='utf-8'),
                              logging.StreamHandler()])

script_directory = os.path.dirname(os.path.abspath(__file__))
script_directory = os.path.dirname(script_directory)
PathDataBase = os.path.join(script_directory, "DataBases", "Users.db")
PX_Path = os.path.join(script_directory, "PXStorage")

ALLOWED_EXTENSIONS:set = {
    # Текстовые файлы
    'txt', 'pdf', 'docx', 'odt', 'rtf', 'md',

    # Изображения
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp',

    # Аудиофайлы
    'mp3', 'wav', 'ogg', 'flac', 'm4a',

    # Видеофайлы
    'mp4', 'mkv', 'mov', 'avi', 'wmv', 'webm',

    # Архивы
    'zip', 'rar', '7z', 'tar', 'gz',

    # Таблицы и презентации
    'xlsx', 'csv', 'pptx'
}

# Максимальный размер файла (в байтах) - 20 ГБ
MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024

app = Flask(
        __name__, 
        template_folder=f"{script_directory}/templates", 
        static_folder=f"{script_directory}/static"
    )

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{PathDataBase}'
app.config['UPLOAD_FOLDER'] = PX_Path
app.secret_key = secrets.token_hex(16)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True) #primary_key  - не позволяет создавать повторные поля с именем id
    user_name = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(250), nullable=False)
    user_api = db.Column(db.String(64), nullable=False)
    personal_box_id = db.Column(db.String(32), nullable=False)
    authorization_token = db.Column(db.String(64), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False)
    verification_code = db.Column(db.String(32), nullable=False)

    def __repr__(self):
        return '<Article %r>' % self.id

if os.path.isfile(PathDataBase):
    logging.info('Database found, no need to create.')

else:
    logging.error('Database not found, creating database and tables...')

    with app.app_context():
        db.create_all()

        logging.info('Database and tables created successfully!')

def user_exists(user_name, email):
    """
    Проверяет, существует ли пользователь с данным именем или email в базе данных.
    """

    existing_user = Article.query.filter((Article.user_name == user_name) | (Article.email == email)).first()
    return existing_user is not None

def find_user_id_with_username(user_name):
    """
    Находит ID пользователя по его имени.
    """
    user = Article.query.filter_by(user_name=user_name).first()

    if user:
        return user.id
    
    return None

def hash_text(text):
    """
    Шифрование полученного текста
    """
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(text.encode('utf-8'), salt)

    return hashed_password

def check_password(password, hashed_password):
    """
    Проверка пароля на правильность
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def register_user(user_name, email, password):
    """
    Регистрирует нового пользователя, если его нет в базе данных.
    """

    if user_exists(user_name, email):
        return jsonify(success=False, message="Уже есть такой пользователь")

    personal_box_id = secrets.token_hex(32)

    new_user = Article(
        user_name=user_name,
        email=email,
        password=hash_text(password),
        user_api=secrets.token_hex(32),
        personal_box_id=personal_box_id,
        authorization_token="none",
        is_verified = False,
        verification_code="none",
    )

    script_directory = os.path.dirname(os.path.abspath(__file__))
    pxStorage_path = os.path.join(script_directory[:-15], "PXStorage")

    user_storage = os.path.join(pxStorage_path, personal_box_id)

    os.makedirs(user_storage, exist_ok=True)

    with app.app_context():
        db.session.add(new_user)
        db.session.commit()

    return jsonify(success=True, message='Вы были успешно зарегестрированны', redirect_url='/login')

def generate_code():
    """
    Генерация случайного кода
    """    
    digits = string.digits
    lowercase_letters = string.ascii_lowercase
    uppercase_letters = string.ascii_uppercase
    
    all_characters = digits + lowercase_letters + uppercase_letters
    
    code = ''.join(random.choice(all_characters) for _ in range(8))
    
    return code

def send_email(to: str, content: str, from_email: str, subject: str):
    """
    Отправка сгенерированного кода по email пользователю
    """
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)

        server.ehlo()
        server.starttls()

        server.login('mail@example.com', 'your mail code')

        message = f"From: {from_email}\nSubject: {subject}\n\n{content}"
        server.sendmail('mail@example.com', to, message.encode('utf-8'))

        server.close()

    except Exception as e:
        logging.error(f"Failed to send email: {e}")

    return jsonify(success=True, message='Код подтверждения успешно отправлен')

def allowed_file(filename):
    """
    Проверка файла на разрешенные расширения
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_valid_size(file):
    """
    Проверяет, не превышает ли размер файла 20 ГБ
    """
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    return file_size <= MAX_FILE_SIZE

import os
from datetime import datetime

def get_file_info(file_path):
    """
    Получает информацию о файле
    """
    try:
        stat = os.stat(file_path)
        
        size_bytes = stat.st_size
        size_readable = format_file_size(size_bytes)
        
        created = datetime.fromtimestamp(stat.st_ctime)
        modified = datetime.fromtimestamp(stat.st_mtime)
        
        return {
            'name': os.path.basename(file_path),
            'size': size_readable,
            'size_bytes': size_bytes,
            'created': created.strftime('%Y-%m-%d %H:%M'),
            'modified': modified.strftime('%Y-%m-%d %H:%M'),
            'extension': os.path.splitext(file_path)[1].lower()
        }
    except Exception as e:
        logging.error(f"Error getting file info: {e}")
        return None

def format_file_size(size_bytes):
    """
    Форматирует размер в читаемый вид
    """
    if size_bytes == 0:
        return "0 B"
    
    size_units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_units) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_units[i]}"

def get_user_storage_info(user_id):
    """
    Получает информацию о хранилище пользователя
    """
    user = Article.query.filter_by(id=user_id).first()
    if not user:
        return None
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)
    
    if not os.path.exists(PX_directory):
        return {
            'total_size': '0 B',
            'total_bytes': 0,
            'file_count': 0,
            'used_percentage': 0
        }
    
    total_bytes = 0
    file_count = 0
    
    for filename in os.listdir(PX_directory):
        file_path = os.path.join(PX_directory, filename)

        if os.path.isfile(file_path):
            file_info = get_file_info(file_path)
            
            if file_info:
                total_bytes += file_info['size_bytes']
                file_count += 1
    
    storage_limit_bytes = 20 * 1024 * 1024 * 1024  # 20 гб
    used_percentage = (total_bytes / storage_limit_bytes) * 100 if storage_limit_bytes > 0 else 0
    
    return {
        'total_size': format_file_size(total_bytes),
        'total_bytes': total_bytes,
        'file_count': file_count,
        'storage_limit': '20 GB',
        'storage_limit_bytes': storage_limit_bytes,
        'used_percentage': round(used_percentage, 1)
    }

def get_subscription_info(user_id):
    """
    Получает информацию о подписке пользователя
    """

    return {
        'plan': 'Lite',
        'status': 'Активна',
        'storage_limit': '20 GB',
        'features': ['20GB хранилища', 'Все форматы файлов', 'API доступ']
    }


#POST запросы ниже
@app.route('/registrationUser', methods=['POST'])
def registrationUser():
    """
    Регистрация пользователя
    """
    data = request.get_json()

    user_name = data.get('user_name')
    email = data.get('email')
    password = data.get('password')

    if user_exists(user_name=user_name, email=email):
        return jsonify(success=False, message='Пользователь с таким именем или почтой уже существует', redirect_url='/register')
        
    else:
        return register_user(user_name=user_name, email=email, password=password)

@app.route('/loginUser', methods=['POST'])
def loginUser():
    """
    Даем вход на акааунт пользователя
    """
    data = request.get_json()
    user_name = data.get('user_name')
    password = data.get('password')
    checkBoxRM = data.get('checkBoxRM')

    user = Article.query.filter_by(user_name=user_name).first()

    if user:
        if check_password(password=password, hashed_password=user.password):
            response = make_response(jsonify(success=True, message="Авторизация успешна", redirect_url='/profile'))

            authorization_token = secrets.token_hex(16)
            user.authorization_token = authorization_token
            db.session.commit()

            if checkBoxRM:
                max_age = 15 * 24 * 60 * 60
                
            else:
                max_age = None

            response.set_cookie('authorization_token', authorization_token, httponly=True, max_age=max_age)

            return response
        
        else:
            return jsonify(success=False, message='Неверный пароль')
        
    else:
        return jsonify(success=False, message='Данный пользователь не найден')

@app.route('/isUserLogin', methods=['POST'])
def isUserLogin():
    """
    Проверяем пользователь уже имеет возможность входа на свой аккаунт
    """
    authorization_token = request.cookies.get('authorization_token')

    if not authorization_token:
        return jsonify(success=False, message='user need autorization_token')
    
    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        return jsonify(success=True, message='Вы уже вошли в аккаунт, если хотите его сменить сначало выйдите с текущего на странице профиля', redirect_url='/')
    
    else:
        return jsonify(success=False, message='user need autorization_token')

@app.route('/whoIsThis', methods=['POST'])
def whoIsThis():
    """
    Определяем какой пользователь вошел в систему
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        return jsonify(success=True, user_name=user.user_name)
    
    else:
        return jsonify(success=False, message='Похоже вы не авторизованны на сайте', redirect_url='/login')
    
@app.route('/thisUserVerifity', methods=['POST'])
def thisUserVerifity():
    """
    Верифицирован ли пользователь? (имеет ли cookies с инфо о authorization_token)
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        if user.is_verified:
            return jsonify(success=True, needCode=False)

        else:
            return jsonify(success=True, needCode=True)

    return jsonify(success=False, message='Пользователь не найден'), 404

@app.route('/verifityAccount', methods=['POST'])
def verifityAccount():
    """
    Формирование кода авторизации и отправка email с ним
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        verification_code = generate_code()

        user.verification_code = verification_code
        db.session.commit()

        send_email(
            to=user.email,
            content=f'''
Код верификации Cloud Box ☁️

Ваш код: {verification_code} 🔐

Используйте этот код для завершения регистрации в Cloud Box.

С уважением - Cloud Box Team
        ''',
            from_email='Cloud Box',
            subject='Ваш код верификации Cloud Box'
        )

        return jsonify(success=True, message=f'Код подтверждения отправлен на почту {user.email}')
    
    else:
        return jsonify(success=False, message='Произошла непредвиденная ошибка, попробуйте позже')

@app.route('/checkCode', methods=['POST'])
def checkCode():
    """
    Сравнить верификационный код
    """
    data = request.get_json()
    authorization_token = request.cookies.get('authorization_token')

    input_code = data.get('codeInput')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        if user.verification_code == input_code:
            user.is_verified = True
            user.verification_code = 'none'
            db.session.commit()

            return jsonify(success=True, message='Аккаунт успешно подтверждён')

        else:
            return jsonify(success=False, message='Неверный код подтверждения')

    return jsonify(success=False, message='Пользователь не найден'), 404

@app.route('/getMyEmail', methods=['POST'])
def getMyEmail():
    """
    Получить email пользователя
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        return jsonify(success=True, message=user.email)

@app.route('/getMyAPI', methods=['POST'])
def getMyAPI():
    """
    Получить API key пользователя
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        return jsonify(success=True, message=user.user_api)
    
@app.route('/btnLogout', methods=['POST'])
def btnLogout():
    """
    Выход из аккаунта
    """
    response = make_response(jsonify(success=True, message="Вы вышли из своего профиля"))
    response.set_cookie('authorization_token', '', httponly=True, expires=0)
    
    return response

@app.route('/userFiles', methods=['POST'])
def userFiles():
    """
    Проверка файлов пользователя
    """
    authorization_token = request.cookies.get('authorization_token')
    
    user = Article.query.filter_by(authorization_token=authorization_token).first()

    if user:
        PX_directory = PX_Path + f"/{user.personal_box_id}"

        if not os.path.exists(PX_directory):
            return jsonify(success=False, error="Папка пользователя не найдена"), 404

        files:list = []

        for filename in os.listdir(PX_directory):
            file_path = os.path.join(PX_directory, filename)

            if os.path.isfile(file_path):
                files.append(filename)

        return jsonify(success=True, files=files), 200
    
    return jsonify(success=False, message="Пользователь не в аккаунте"), 404

@app.route('/uploadFile', methods=['POST'])
def uploadFile():
    """
    Загрузка файлов на облако пользователя
    """
    authorization_token = request.cookies.get('authorization_token')

    user = Article.query.filter_by(authorization_token=authorization_token).first()

    PX_directory = os.path.join(PX_Path, str(user.personal_box_id))

    data = request.files['file']

    if not allowed_file(data.filename):
        return jsonify(success=False, message="Недопустимое расширение файла"), 400

    if not is_valid_size(data):
        return jsonify(success=False, message="Файл слишком большой. Макс. 20 ГБ"), 400

    filename = data.filename

    if '../' in filename or '..\\' in filename:
        return jsonify(success=False, message="Недопустимое имя файла"), 400
    
    filename = os.path.basename(filename)
    
    if not filename or filename.strip() == '':
        filename = 'uploaded_file'

    file_path = os.path.join(PX_directory, filename)

    try:
        data.save(file_path)
        return jsonify(success=True, message="Файл успешно загружен!")
    
    except Exception as e:
        return jsonify(success=False, message=f"Ошибка при загрузке: {str(e)}"), 500

@app.route('/userFilesWithInfo', methods=['POST'])
def user_files_with_info():
    """
    Возвращает файлы с полной информацией
    """
    authorization_token = request.cookies.get('authorization_token')
    user = Article.query.filter_by(authorization_token=authorization_token).first()
    
    if not user:
        return jsonify(success=False, message="Пользователь не найден"), 404
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)
    
    if not os.path.exists(PX_directory):
        return jsonify(success=True, files=[]), 200
    
    files_info:list = []

    for filename in os.listdir(PX_directory):
        file_path = os.path.join(PX_directory, filename)

        if os.path.isfile(file_path):
            file_info = get_file_info(file_path)

            if file_info:
                files_info.append(file_info)
    
    return jsonify(success=True, files=files_info), 200

@app.route('/storageInfo', methods=['POST'])
def storage_info():
    """
    Возвращает информацию о хранилище
    """
    authorization_token = request.cookies.get('authorization_token')
    user = Article.query.filter_by(authorization_token=authorization_token).first()
    
    if not user:
        return jsonify(success=False, message="Пользователь не найден"), 404
    
    storage_info = get_user_storage_info(user.id)

    return jsonify(success=True, storage_info=storage_info), 200

@app.route('/subscriptionInfo', methods=['POST'])
def subscription_info():
    """
    Возвращает информацию о подписке
    """
    authorization_token = request.cookies.get('authorization_token')
    user = Article.query.filter_by(authorization_token=authorization_token).first()
    
    if not user:
        return jsonify(success=False, message="Пользователь не найден"), 404
    
    subscription_info = get_subscription_info(user.id)

    return jsonify(success=True, subscription_info=subscription_info), 200

@app.route('/downloadFile', methods=['POST'])
def download_file():
    authorization_token = request.cookies.get('authorization_token')
    user = Article.query.filter_by(authorization_token=authorization_token).first()
    
    if not user:
        return jsonify(success=False, message="Пользователь не найден"), 404
    
    data = request.get_json()
    filename = data.get('filename')
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)
    file_path = os.path.join(PX_directory, filename)
    
    if not os.path.exists(file_path):
        return jsonify(success=False, message="Файл не найден"), 404
    
    return send_file(file_path, as_attachment=True, download_name=filename)

@app.route('/deleteFile', methods=['POST'])
def delete_file():
    authorization_token = request.cookies.get('authorization_token')
    user = Article.query.filter_by(authorization_token=authorization_token).first()
    
    if not user:
        return jsonify(success=False, message="Пользователь не найден"), 404
    
    data = request.get_json()
    filename = data.get('filename')
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)
    file_path = os.path.join(PX_directory, filename)
    
    if not os.path.exists(file_path):
        return jsonify(success=False, message="Файл не найден"), 404
    
    try:
        os.remove(file_path)

        return jsonify(success=True, message="Файл успешно удален")
    
    except Exception as e:
        return jsonify(success=False, message=f"Ошибка удаления: {str(e)}"), 500


#API запросы ниже
@app.route('/api/<api_key>/user_info', methods=['GET'])
def api_get_user_info(api_key):
    """
    Получить информацию о пользователе через API
    """
    user = Article.query.filter_by(user_api=api_key).first()

    if not user:
        return jsonify({
            'success': False,
            'error': 'Invalid API key',
        }), 401
    
    return jsonify({
        'success': True,
        'user_name': user.user_name,
        'email': user.email,
        'user_api': user.user_api,
        'personal_box_id': user.personal_box_id,
        'is_verified': user.is_verified
    }), 200

@app.route('/api/<api_key>/user_files', methods=['GET'])
def api_get_user_files(api_key):
    """
    Получить файлы из облака пользователя
    """
    user = Article.query.filter_by(user_api=api_key).first()

    if not user:
        return jsonify({
            'success': False,
            'error': 'Invalid API key',
        }), 401
    
    PX_directory = PX_Path + f"/{user.personal_box_id}"

    if not os.path.exists(PX_directory):
        return jsonify({
            'success': False,
            'error': 'Unable to find user cloud'
        }), 404

    files:list = []

    for filename in os.listdir(PX_directory):
        file_path = os.path.join(PX_directory, filename)

        if os.path.isfile(file_path):
            files.append(filename)

    return Response(
        json.dumps({
            'success': True,
            'files': files
        }, ensure_ascii=False),
        mimetype='application/json; charset=utf-8'
    ), 200

@app.route('/api/<api_key>/upload_file', methods=['POST'])
def api_upload_file(api_key):
    """
    Загрузить файл в облако
    """
    user = Article.query.filter_by(user_api=api_key).first()

    if not user:
        return jsonify({
            'success': False,
            'error': 'Invalid API key',
        }), 401

    data = request.files['file']
    
    if data.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    if not allowed_file(data.filename):
        return jsonify({
            'success': False,
            'error': 'File type not allowed'
        }), 400
    
    if not is_valid_size(data):
        return jsonify({
            'success': False, 
            'error': 'File too large. Max 20GB'
        }), 400
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)

    filename = data.filename

    if '../' in filename or '..\\' in filename:
        return jsonify(success=False, message="Недопустимое имя файла"), 400
    
    filename = os.path.basename(filename)
    
    if not filename or filename.strip() == '':
        filename = 'uploaded_file'

    file_path = os.path.join(PX_directory, filename)
    
    try:
        data.save(file_path)

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': filename,
            'size': os.path.getsize(file_path)
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@app.route('/api/<api_key>/delete_file/<file_name>', methods=['POST'])
def api_delete_file(api_key, file_name):
    """
    Удалить файл из облака
    """
    user = Article.query.filter_by(user_api=api_key).first()

    if not user:
        return jsonify({
            'success': False,
            'error': 'Invalid API key',
        }), 401
    
    filename = file_name
    
    PX_directory = os.path.join(PX_Path, user.personal_box_id)
    file_path = os.path.join(PX_directory, filename)
    
    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'error': 'File not found'
        }), 404
    
    try:
        os.remove(file_path)
    
        return Response(
        json.dumps({
            'success': True,
            'message': f'Delete {filename}'
        }, ensure_ascii=False),
        mimetype='application/json; charset=utf-8',
        status=200
        )
    
    except Exception as error:    
        return jsonify({
            'success': False,
            'message': f'Error deleting: {str(error)}'
        }), 500


#GET запросы ниже
@app.route('/', methods=['GET'])
def main_page():
    return render_template('main.html')

@app.route('/register', methods=['GET'])
def reg_page():
    return render_template('reg.html')

@app.route('/login', methods=['GET'])
def log_page():
    return render_template('log.html')

@app.route('/profile', methods=['GET'])
def profile_page():
    return render_template('profile.html')

@app.route('/coming-soon', methods=['GET'])
def coming_soon_page():
    return render_template('coming-soon.html')

@app.route('/api-docs', methods=['GET'])
def api_docs_page():
    return render_template('api-docs.html')

@app.errorhandler(404)
def page_not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': 'API endpoint not found. Please check documentation API - http://192.168.1.8:8000/api-docs',
        }), 404
    
    return render_template('page-not-found.html'), 404


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
