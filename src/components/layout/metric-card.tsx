import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {helper ? <CardDescription>{helper}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
