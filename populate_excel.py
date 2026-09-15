import openpyxl
import os
import shutil

def populate_match_data():
    src_file = "Template Analysis.xlsx"
    out_file = "Match_Analysis_Hewah_vs_Windu.xlsx"

    if not os.path.exists(src_file):
        print(f"Error: {src_file} not found.")
        return

    # Make a working copy
    shutil.copyfile(src_file, out_file)
    wb = openpyxl.load_workbook(out_file)
    ws = wb['Print File']

    # Header Match Information (Top-left cells of merged ranges)
    ws['D1'] = "Hewah vs Windu / Lima Putra Jaya"
    ws['S1'] = "PASER FUTSAL CUP"
    ws['Z1'] = "07/08/2024"
    ws['AF1'] = "19:00"
    ws['AL1'] = "Moncong Bulo"

    # Timeouts
    ws['AB4'] = "H: 07:53"
    ws['AB6'] = "H: 09:31"

    # Score & Teams
    # Row 5: Hewah Paser
    ws['A5'] = "Hewah Paser"
    ws['D5'] = 1  # 1st Half
    ws['G5'] = 0  # 2nd Half
    ws['J5'] = 1  # Final

    # Row 6: Lima Putra Jaya / Windu
    ws['A6'] = "Lima Putra Jaya"
    ws['D6'] = 0  # 1st Half
    ws['G6'] = 1  # 2nd Half
    ws['J6'] = 1  # Final

    # Players data from IMG_1840.heic:
    players = [
        {"no": 1, "name": "Radit (GK)", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": 1, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 2, "name": "Ridho", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 3, "name": "Sahu", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 4, "name": "Galang", "y": 1, "r": None, "loss_1": 1, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": 1, "sh_1": None, "sh_2": 1, "gl_1": None, "gl_2": None},
        {"no": 5, "name": "Fiqih pk", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 6, "name": "Ibnu", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": 1, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 7, "name": "Ryan", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": 1, "sh_2": 1, "gl_1": None, "gl_2": None},
        {"no": 8, "name": "Zikri", "y": None, "r": None, "loss_1": None, "loss_2": 1, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": 2, "gl_1": 1, "gl_2": None},
        {"no": 9, "name": "Ikhsan", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": 1, "gl_1": None, "gl_2": None},
        {"no": 10, "name": "Arif", "y": None, "r": None, "loss_1": None, "loss_2": 1, "rec_1": 1, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": 1, "gl_1": None, "gl_2": None},
        {"no": 11, "name": "Varel", "y": None, "r": None, "loss_1": 1, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 12, "name": "Nathan", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 13, "name": "Danal", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 14, "name": "Fahrul", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
        {"no": 15, "name": "Irfan", "y": None, "r": None, "loss_1": None, "loss_2": None, "rec_1": None, "rec_2": None, "fl_1": None, "fl_2": None, "sh_1": None, "sh_2": None, "gl_1": None, "gl_2": None},
    ]

    start_row = 13
    for i, p in enumerate(players):
        r = start_row + i
        ws.cell(row=r, column=1, value=p["no"])      # A
        ws.cell(row=r, column=2, value=p["name"])    # B (merged B:D)
        ws.cell(row=r, column=5, value=p["y"])       # E
        ws.cell(row=r, column=6, value=p["r"])       # F
        ws.cell(row=r, column=7, value=p["loss_1"])  # G (merged G:H)
        ws.cell(row=r, column=9, value=p["loss_2"])  # I (merged I:J)
        ws.cell(row=r, column=11, value=p["rec_1"])  # K (merged K:L)
        ws.cell(row=r, column=13, value=p["rec_2"])  # M (merged M:N)
        ws.cell(row=r, column=15, value=p["fl_1"])   # O (merged O:P)
        ws.cell(row=r, column=17, value=p["fl_2"])   # Q (merged Q:R)
        ws.cell(row=r, column=19, value=p["sh_1"])   # S (merged S:T)
        ws.cell(row=r, column=21, value=p["sh_2"])   # U (merged U:V)
        ws.cell(row=r, column=23, value=p["gl_1"])   # W (merged W:X)
        ws.cell(row=r, column=25, value=p["gl_2"])   # Y (merged Y:Z)

    # Paket (Combinations) in Column AE
    pakets = [
        "1-3-4-5-6",
        "1-8-2-10-9",
        "1-4-5-6",
        "1-2-14-8-9",
        "1-3-4-10-6",
        "1-9-13-6-5",
        "15-3-4-7-11",
        "15-3-4-7-8",
        "15-10-9-14-8"
    ]
    # Unmerge AE4:AW29 if needed, or format cleanly
    ws['AE4'] = "\n".join([f"{i+1}. {pkt}" for i, pkt in enumerate(pakets)])

    # Bottom pitch summary tables
    # Recovered balls:
    # Own field: Hewah Paser = 1, Lima Putra Jaya = 0
    # Opposite field: Hewah Paser = 0, Lima Putra Jaya = 0
    # Shots Hewah Paser: On Target=1, Out=1, Rejected=1, Post=0, Goal=1
    # Shots Lima Putra Jaya: On Target=1, Out=1, Rejected=0, Post=0, Goal=1

    wb.save(out_file)
    print(f"Successfully generated: {out_file}")

if __name__ == "__main__":
    populate_match_data()
