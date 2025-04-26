import argparse
import sys
from app import app
from models import db, User

def make_admin(email):
    print(f"Попытка сделать пользователя '{email}' администратором...")
    try:
        user = User.query.filter_by(email=email).first()

        if user:
            if user.is_admin:
                print(f"Пользователь '{user.username}' ({user.email}) уже является администратором.")
            else:
                user.is_admin = True
                db.session.add(user)
                db.session.commit()
                print(f"Успешно! Пользователь '{user.username}' ({user.email}) теперь администратор.")
        else:
            print(f"Ошибка: Пользователь с email '{email}' не найден в базе данных.")
            sys.exit(1)

    except Exception as e:
        db.session.rollback()
        print(f"Произошла ошибка при обновлении пользователя: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Сделать пользователя администратором.')
    parser.add_argument('email', type=str, help='Email пользователя, которого нужно сделать администратором.')

    args = parser.parse_args()

    with app.app_context():
        make_admin(args.email)

    print("Скрипт завершен.")