from django.db import migrations


SPECIALTIES = [
    ("Cardiology", "cardiology", ["heart", "chest pain", "palpitations"]),
    ("Neurology", "neurology", ["headache", "seizure", "numbness"]),
    ("General Practice", "general-practice", ["general", "checkup", "flu"]),
    ("Pulmonology", "pulmonology", ["cough", "breathing", "asthma"]),
    ("Gastroenterology", "gastroenterology", ["stomach", "nausea", "digestion"]),
    ("Dermatology", "dermatology", ["skin", "rash", "eczema"]),
    ("Orthopedics", "orthopedics", ["bone", "joint", "fracture"]),
    ("Pediatrics", "pediatrics", ["child", "infant", "vaccination"]),
    ("Ophthalmology", "ophthalmology", ["eye", "vision", "cataract"]),
    ("ENT", "ent", ["ear", "nose", "throat", "hearing"]),
    ("Urology", "urology", ["kidney", "bladder", "urinary"]),
    ("Endocrinology", "endocrinology", ["diabetes", "thyroid", "hormone"]),
]


def seed(apps, schema_editor):
    Specialty = apps.get_model("organizations", "Specialty")
    for name, slug, keywords in SPECIALTIES:
        Specialty.objects.get_or_create(
            name=name,
            defaults={"slug": slug, "symptom_keywords": keywords},
        )


def unseed(apps, schema_editor):
    Specialty = apps.get_model("organizations", "Specialty")
    slugs = [s[1] for s in SPECIALTIES]
    Specialty.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(seed, unseed),
    ]
