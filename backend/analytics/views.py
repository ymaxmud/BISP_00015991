from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id
from appointments.models import Appointment
from doctors.models import DoctorProfile
from queueing.models import QueueTicket


def _scoped_appointments(user):
    qs = Appointment.objects.all()
    if is_superadmin(user):
        return qs
    own_patient_id = patient_profile_id(user)
    if own_patient_id:
        return qs.filter(patient_profile_id=own_patient_id)
    own_doctor_id = doctor_profile_id(user)
    if own_doctor_id:
        return qs.filter(doctor_profile_id=own_doctor_id)
    org_ids = organization_ids_for_user(user)
    if org_ids:
        return qs.filter(organization_id__in=org_ids)
    return qs.none()


def _scoped_queue_tickets(user):
    appointment_qs = _scoped_appointments(user)
    return QueueTicket.objects.filter(appointment__in=appointment_qs)


def _scoped_doctors(user):
    qs = DoctorProfile.objects.filter(is_active=True)
    if is_superadmin(user):
        return qs
    own_doctor_id = doctor_profile_id(user)
    if own_doctor_id:
        return qs.filter(id=own_doctor_id)
    own_patient_id = patient_profile_id(user)
    if own_patient_id:
        return qs.filter(appointments__patient_profile_id=own_patient_id).distinct()
    org_ids = organization_ids_for_user(user)
    if org_ids:
        return qs.filter(organization_id__in=org_ids)
    return qs.none()


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        appointments_today = _scoped_appointments(request.user).filter(appointment_time__date=today)
        total_today = appointments_today.count()
        completed = appointments_today.filter(status='completed').count()
        no_show = appointments_today.filter(status='no_show').count()
        no_show_rate = round(no_show / total_today * 100, 1) if total_today > 0 else 0

        avg_wait = _scoped_queue_tickets(request.user).filter(
            assigned_at__date=today
        ).aggregate(avg=Avg('estimated_wait_minutes'))['avg'] or 0

        queue_pressure = _scoped_queue_tickets(request.user).filter(
            queue_status__in=['waiting', 'called']
        ).count()

        active_doctors = _scoped_doctors(request.user).count()

        return Response({
            'appointments_today': total_today,
            'completed_today': completed,
            'no_show_rate': no_show_rate,
            'avg_wait_time': round(avg_wait, 1),
            'queue_pressure': queue_pressure,
            'active_doctors': active_doctors,
        })


class AppointmentTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        appointment_qs = _scoped_appointments(request.user)
        trends = []
        for i in range(7):
            day = today - timezone.timedelta(days=6 - i)
            count = appointment_qs.filter(appointment_time__date=day).count()
            trends.append({'date': day.isoformat(), 'count': count})
        return Response(trends)


class DoctorWorkloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        doctors = _scoped_doctors(request.user).annotate(
            today_count=Count('appointments', filter=Q(appointments__appointment_time__date=today)),
            total_count=Count('appointments'),
            avg_rating=Avg('reviews__rating'),
        ).values('id', 'full_name', 'today_count', 'total_count', 'avg_rating')
        return Response(list(doctors))


class QueueAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = _scoped_queue_tickets(request.user)
        total = tickets.count()
        triage_dist = {
            'normal': tickets.filter(triage_level='normal').count(),
            'priority': tickets.filter(triage_level='priority').count(),
            'urgent': tickets.filter(triage_level='urgent').count(),
        }
        avg_wait = tickets.aggregate(avg=Avg('estimated_wait_minutes'))['avg'] or 0
        return Response({
            'total_tickets': total,
            'triage_distribution': triage_dist,
            'avg_wait_minutes': round(avg_wait, 1),
        })
