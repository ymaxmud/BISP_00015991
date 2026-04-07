from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from doctors.models import DoctorProfile
from queueing.models import QueueTicket
from reviews.models import Review


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        appointments_today = Appointment.objects.filter(appointment_time__date=today)
        total_today = appointments_today.count()
        completed = appointments_today.filter(status='completed').count()
        no_show = appointments_today.filter(status='no_show').count()
        no_show_rate = round(no_show / total_today * 100, 1) if total_today > 0 else 0

        avg_wait = QueueTicket.objects.filter(
            assigned_at__date=today
        ).aggregate(avg=Avg('estimated_wait_minutes'))['avg'] or 0

        queue_pressure = QueueTicket.objects.filter(
            queue_status__in=['waiting', 'called']
        ).count()

        active_doctors = DoctorProfile.objects.filter(is_active=True).count()

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
        trends = []
        for i in range(7):
            day = today - timezone.timedelta(days=6 - i)
            count = Appointment.objects.filter(appointment_time__date=day).count()
            trends.append({'date': day.isoformat(), 'count': count})
        return Response(trends)


class DoctorWorkloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        doctors = DoctorProfile.objects.filter(is_active=True).annotate(
            today_count=Count('appointment', filter=Q(appointment__appointment_time__date=today)),
            total_count=Count('appointment'),
            avg_rating=Avg('review__rating'),
        ).values('id', 'full_name', 'today_count', 'total_count', 'avg_rating')
        return Response(list(doctors))


class QueueAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = QueueTicket.objects.all()
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
