import { motion } from "framer-motion";
import { BookOpen, User, MapPin, Calendar, GraduationCap, FileText } from "lucide-react";

const details = [
  { icon: BookOpen, label: "Faculty", value: "Information Communication Technology" },
  { icon: User, label: "Department", value: "Computer Science" },
  { icon: MapPin, label: "Institution", value: "Ruaha Catholic University (RUCU)" },
  { icon: Calendar, label: "Date", value: "February 2026" },
];

const ProjectInfo = () => (
  <section id="about" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
    <div className="container mx-auto px-6 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Project Details</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          About This <span className="text-primary text-glow">Project</span>
        </h2>
      </motion.div>

      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4 mb-10">
        {details.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm group hover:border-primary/20 transition-all"
          >
            <div className="p-2 rounded-lg bg-primary/8 text-primary border border-primary/10 shrink-0">
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto p-7 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary/60" />
          <h3 className="font-display font-semibold text-foreground">Abstract</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-[1.8]">
          This project designs and implements a unified cyber security framework integrating system security, 
          web application security, and network security into one platform. The framework collects logs from all layers, 
          correlates events in real time, and sends quick alerts using Design Science Research methodology 
          and open-source tools tested in a safe lab environment. Expected results include faster threat detection, 
          lower management costs, and quicker response to attacks.
        </p>
      </motion.div>
    </div>
  </section>
);

export default ProjectInfo;
