"""
Seed the database with demo data for Avicenna.
Usage: python manage.py seed_demo
"""

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from organizations.models import Organization, Department, Specialty
from doctors.models import DoctorProfile, DoctorSpecialty
from patients.models import PatientProfile, MedicalHistory
from appointments.models import Appointment
from queueing.models import IntakeForm, QueueTicket
from encounters.models import Encounter
from prescriptions.models import Prescription
from reminders.models import Reminder
from reviews.models import Review


class Command(BaseCommand):
    help = "Seed the database with demo data for Avicenna"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Avicenna demo data...")

        # --- Specialties ---
        specs = {}
        for name, keywords in [
            ("Cardiology", ["heart", "chest pain", "palpitations"]),
            ("Neurology", ["headache", "seizure", "numbness"]),
            ("General Practice", ["general", "checkup", "flu"]),
            ("Pulmonology", ["cough", "breathing", "asthma"]),
            ("Gastroenterology", ["stomach", "nausea", "digestion"]),
            ("Dermatology", ["skin", "rash", "eczema"]),
        ]:
            spec, _ = Specialty.objects.get_or_create(
                name=name,
                defaults={"slug": name.lower().replace(" ", "-"), "symptom_keywords": keywords},
            )
            specs[name] = spec

        # --- Organization ---
        org, _ = Organization.objects.get_or_create(
            slug="avicenna-medical-center",
            defaults={
                "name": "Avicenna Medical Center",
                "type": "clinic",
                "city": "Tashkent",
                "address": "12 Amir Temur Avenue, Tashkent 100000",
                "description": "Premier private clinic offering comprehensive outpatient services with AI-assisted clinical support.",
                "phone": "+998 71 200 0001",
                "email": "info@avicenna.uz",
            },
        )

        dept_general, _ = Department.objects.get_or_create(
            organization=org, slug="general", defaults={"name": "General Medicine"}
        )
        dept_cardio, _ = Department.objects.get_or_create(
            organization=org, slug="cardiology", defaults={"name": "Cardiology"}
        )

        # --- Doctor users and profiles ---
        doctors_data = [
            {
                "email": "dr.karimov@avicenna.uz",
                "first": "Aziz",
                "last": "Karimov",
                "bio": "Board-certified cardiologist with 15 years of experience in interventional cardiology and preventive heart care.",
                "years": 15,
                "fee": Decimal("200000"),
                "slug": "aziz-karimov",
                "specialty": "Cardiology",
                "languages": ["en", "ru", "uz"],
            },
            {
                "email": "dr.rahimova@avicenna.uz",
                "first": "Nilufar",
                "last": "Rahimova",
                "bio": "Experienced neurologist specializing in headache disorders, epilepsy, and neurodegenerative conditions.",
                "years": 12,
                "fee": Decimal("180000"),
                "slug": "nilufar-rahimova",
                "specialty": "Neurology",
                "languages": ["ru", "uz"],
            },
            {
                "email": "dr.toshmatov@avicenna.uz",
                "first": "Jasur",
                "last": "Toshmatov",
                "bio": "Family medicine physician focused on preventive care, chronic disease management, and patient education.",
                "years": 8,
                "fee": Decimal("120000"),
                "slug": "jasur-toshmatov",
                "specialty": "General Practice",
                "languages": ["en", "uz"],
            },
        ]

        doc_profiles = []
        for d in doctors_data:
            user, created = User.objects.get_or_create(
                email=d["email"],
                defaults={
                    "username": d["email"].split("@")[0],
                    "first_name": d["first"],
                    "last_name": d["last"],
                    "role": "doctor",
                },
            )
            if created:
                user.set_password("demo1234")
                user.save()

            profile, _ = DoctorProfile.objects.get_or_create(
                user=user,
                defaults={
                    "organization": org,
                    "full_name": f"Dr. {d['first']} {d['last']}",
                    "bio": d["bio"],
                    "years_experience": d["years"],
                    "consultation_fee": d["fee"],
                    "public_slug": d["slug"],
                    "is_verified": True,
                    "is_active": True,
                    "languages": d["languages"],
                },
            )
            DoctorSpecialty.objects.get_or_create(
                doctor_profile=profile, specialty=specs[d["specialty"]]
            )
            doc_profiles.append(profile)

        # --- Patient users and profiles ---
        patients_data = [
            {"email": "sardor@mail.uz", "first": "Sardor", "last": "Umarov", "dob": "1990-05-15", "gender": "male"},
            {"email": "dilnoza@mail.uz", "first": "Dilnoza", "last": "Alimova", "dob": "1985-11-22", "gender": "female"},
            {"email": "bobur@mail.uz", "first": "Bobur", "last": "Yusupov", "dob": "1978-03-10", "gender": "male"},
            {"email": "gulnara@mail.uz", "first": "Gulnara", "last": "Rashidova", "dob": "1995-07-08", "gender": "female"},
            {"email": "timur@mail.uz", "first": "Timur", "last": "Nazarov", "dob": "1960-01-20", "gender": "male"},
        ]

        pat_profiles = []
        for p in patients_data:
            user, created = User.objects.get_or_create(
                email=p["email"],
                defaults={
                    "username": p["email"].split("@")[0],
                    "first_name": p["first"],
                    "last_name": p["last"],
                    "role": "patient",
                },
            )
            if created:
                user.set_password("demo1234")
                user.save()

            profile, _ = PatientProfile.objects.get_or_create(
                user=user,
                defaults={
                    "first_name": p["first"],
                    "last_name": p["last"],
                    "dob": p["dob"],
                    "gender": p["gender"],
                    "address": "Tashkent, Uzbekistan",
                    "emergency_contact": "+998 90 000 0000",
                },
            )
            pat_profiles.append(profile)

        # Medical histories
        histories = [
            {"patient": pat_profiles[0], "chronic": "None", "allergies": "Penicillin", "meds": "None", "prev": "Appendectomy 2015"},
            {"patient": pat_profiles[1], "chronic": "Hypertension", "allergies": "Sulfa drugs", "meds": "Enalapril 10mg daily", "prev": "Gestational diabetes 2018"},
            {"patient": pat_profiles[2], "chronic": "Type 2 Diabetes, Hypertension", "allergies": "None known", "meds": "Metformin 500mg twice daily, Lisinopril 20mg daily", "prev": "MI 2020"},
            {"patient": pat_profiles[3], "chronic": "Asthma", "allergies": "Aspirin, NSAIDs", "meds": "Salbutamol inhaler PRN", "prev": "None significant"},
            {"patient": pat_profiles[4], "chronic": "COPD, Atrial fibrillation", "allergies": "Codeine", "meds": "Warfarin 5mg daily, Salbutamol, Tiotropium", "prev": "Coronary bypass 2018"},
        ]
        for h in histories:
            MedicalHistory.objects.get_or_create(
                patient_profile=h["patient"],
                defaults={
                    "chronic_conditions": h["chronic"],
                    "allergies": h["allergies"],
                    "current_medications": h["meds"],
                    "previous_conditions": h["prev"],
                },
            )

        # --- Admin user ---
        admin_user, created = User.objects.get_or_create(
            email="admin@avicenna.uz",
            defaults={
                "username": "admin",
                "first_name": "Admin",
                "last_name": "Avicenna",
                "role": "admin",
                "is_staff": True,
            },
        )
        if created:
            admin_user.set_password("admin1234")
            admin_user.save()

        # --- Appointments ---
        now = timezone.now()
        appt_data = [
            {"patient": 0, "doctor": 0, "status": "scheduled", "offset_hours": 2, "reason": "Chest pain and shortness of breath"},
            {"patient": 1, "doctor": 1, "status": "scheduled", "offset_hours": 3, "reason": "Recurring severe headaches"},
            {"patient": 2, "doctor": 0, "status": "in_queue", "offset_hours": 1, "reason": "Follow-up for heart condition"},
            {"patient": 3, "doctor": 2, "status": "in_consultation", "offset_hours": 0, "reason": "Asthma flare-up and breathing difficulty"},
            {"patient": 4, "doctor": 0, "status": "scheduled", "offset_hours": 4, "reason": "Warfarin dosage review"},
            {"patient": 0, "doctor": 2, "status": "completed", "offset_hours": -24, "reason": "Annual checkup"},
            {"patient": 1, "doctor": 2, "status": "completed", "offset_hours": -48, "reason": "Blood pressure monitoring"},
            {"patient": 2, "doctor": 1, "status": "completed", "offset_hours": -72, "reason": "Numbness in left hand"},
            {"patient": 3, "doctor": 2, "status": "cancelled", "offset_hours": -96, "reason": "General consultation"},
            {"patient": 4, "doctor": 1, "status": "no_show", "offset_hours": -120, "reason": "Follow-up appointment"},
        ]

        appointments = []
        for a in appt_data:
            appt, _ = Appointment.objects.get_or_create(
                organization=org,
                patient_profile=pat_profiles[a["patient"]],
                doctor_profile=doc_profiles[a["doctor"]],
                appointment_time=now + timedelta(hours=a["offset_hours"]),
                defaults={
                    "status": a["status"],
                    "appointment_type": "consultation",
                    "reason": a["reason"],
                },
            )
            appointments.append(appt)

        # --- Intake forms and queue tickets ---
        intake_data = [
            {"appt": 0, "symptoms": "Chest pain radiating to left arm, shortness of breath", "duration": "2 days", "severity": "severe"},
            {"appt": 1, "symptoms": "Recurring severe headaches with vision changes", "duration": "2 weeks", "severity": "moderate"},
            {"appt": 2, "symptoms": "Follow-up: occasional chest discomfort on exertion", "duration": "1 month", "severity": "mild"},
            {"appt": 3, "symptoms": "Wheezing, difficulty breathing, tight chest", "duration": "3 days", "severity": "severe"},
            {"appt": 4, "symptoms": "Need warfarin dosage review, occasional bleeding gums", "duration": "1 week", "severity": "moderate"},
        ]

        for idx, i in enumerate(intake_data):
            appt = appointments[i["appt"]]
            form, _ = IntakeForm.objects.get_or_create(
                appointment=appt,
                defaults={
                    "symptoms": i["symptoms"],
                    "duration": i["duration"],
                    "severity": i["severity"],
                    "history_text": histories[i["appt"]]["prev"],
                    "allergies_text": histories[i["appt"]]["allergies"],
                    "medications_text": histories[i["appt"]]["meds"],
                },
            )

            triage = "normal"
            if i["severity"] == "severe":
                triage = "urgent"
            elif i["severity"] == "moderate":
                triage = "priority"

            QueueTicket.objects.get_or_create(
                appointment=appt,
                defaults={
                    "queue_number": idx + 1,
                    "triage_level": triage,
                    "queue_status": "waiting",
                    "estimated_wait_minutes": (idx + 1) * 12,
                },
            )

        # --- Encounters with prescriptions (for completed appointments) ---
        enc_data = [
            {
                "appt": 5,
                "summary": "Annual wellness exam. Patient in good health.",
                "assessment": "No acute findings. BP 120/80. BMI normal.",
                "plan": "Continue current lifestyle. Return in 12 months.",
                "meds": [("Vitamin D", "1000 IU", "once daily", 90)],
            },
            {
                "appt": 6,
                "summary": "Blood pressure monitoring follow-up. BP 145/92.",
                "assessment": "Hypertension not adequately controlled on current regimen.",
                "plan": "Increase Enalapril to 20mg. Dietary counseling. Recheck in 4 weeks.",
                "meds": [("Enalapril", "20mg", "once daily", 30)],
            },
            {
                "appt": 7,
                "summary": "Numbness in left hand. Neurological exam performed.",
                "assessment": "Likely carpal tunnel syndrome. No central neurological deficit.",
                "plan": "Wrist splint at night. NSAIDs for pain. EMG if no improvement in 4 weeks.",
                "meds": [
                    ("Ibuprofen", "400mg", "twice daily with food", 14),
                    ("Vitamin B12", "1000mcg", "once daily", 30),
                ],
            },
        ]

        for e in enc_data:
            appt = appointments[e["appt"]]
            encounter, _ = Encounter.objects.get_or_create(
                appointment=appt,
                defaults={
                    "doctor_profile": appt.doctor_profile,
                    "summary_notes": e["summary"],
                    "assessment_notes": e["assessment"],
                    "plan_notes": e["plan"],
                },
            )
            for med_name, dosage, schedule, days in e["meds"]:
                Prescription.objects.get_or_create(
                    encounter=encounter,
                    medication_name=med_name,
                    defaults={
                        "dosage": dosage,
                        "schedule": schedule,
                        "duration_days": days,
                        "source": "doctor",
                    },
                )

        # --- Reminders ---
        Reminder.objects.get_or_create(
            patient_profile=pat_profiles[1],
            title="Take Enalapril 20mg",
            defaults={
                "reminder_type": "medication",
                "scheduled_time": now + timedelta(hours=8),
                "status": "pending",
            },
        )
        Reminder.objects.get_or_create(
            patient_profile=pat_profiles[0],
            title="Follow-up with Dr. Karimov",
            defaults={
                "reminder_type": "follow_up",
                "scheduled_time": now + timedelta(days=14),
                "status": "pending",
            },
        )

        # --- Reviews ---
        review_data = [
            {"patient": 0, "doctor": 2, "appt": 5, "rating": 5, "comment": "Excellent doctor. Very thorough and caring."},
            {"patient": 1, "doctor": 2, "appt": 6, "rating": 4, "comment": "Professional and clear explanations. Short wait time."},
            {"patient": 2, "doctor": 1, "appt": 7, "rating": 5, "comment": "Dr. Rahimova is very knowledgeable. Highly recommend."},
        ]
        for r in review_data:
            Review.objects.get_or_create(
                patient_profile=pat_profiles[r["patient"]],
                doctor_profile=doc_profiles[r["doctor"]],
                appointment=appointments[r["appt"]],
                defaults={
                    "rating": r["rating"],
                    "comment": r["comment"],
                    "is_verified": True,
                },
            )

        self.stdout.write(self.style.SUCCESS(
            "Demo data seeded successfully!\n"
            "  - 1 clinic, 2 departments, 6 specialties\n"
            "  - 3 doctors, 5 patients, 1 admin\n"
            "  - 10 appointments, 5 intake forms, 5 queue tickets\n"
            "  - 3 encounters, 4 prescriptions, 2 reminders, 3 reviews\n"
            "\nLogin credentials:\n"
            "  Admin: admin@avicenna.uz / admin1234\n"
            "  Doctor: dr.karimov@avicenna.uz / demo1234\n"
            "  Patient: sardor@mail.uz / demo1234"
        ))
